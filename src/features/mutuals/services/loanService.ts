import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type {
  CreateLoanEntryData,
  LoanEntry,
  LoanEntryKind,
  LoanLedger,
} from '@/types'

const MUTUALS_COLLECTION = 'mutuals'
const LOAN_LEDGERS_SUBCOLLECTION = 'loanLedgers'
const ENTRIES_SUBCOLLECTION = 'entries'
const ACCOUNTS_COLLECTION = 'accounts'
const ASSETS_SUBCOLLECTION = 'assets'
const OPERATIONS_SUBCOLLECTION = 'operations'

function firestoreDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

function numericAmount(value: unknown) {
  const amount = typeof value === 'string' ? parseFloat(value) : Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function ledgerDocumentId(
  lenderAccountId: string,
  borrowerAccountId: string,
  currency: string
) {
  const [firstAccountId, secondAccountId] = [
    lenderAccountId,
    borrowerAccountId,
  ].sort()
  return `${firstAccountId}--${secondAccountId}--${currency}`
}

function balanceDelta(kind: LoanEntryKind, amount: number) {
  return kind === 'repayment' ? -amount : amount
}

export async function getLoanLedger(mutualId: string): Promise<LoanLedger | null> {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) return null

    const ledgersSnapshot = await getDocs(
      query(
        collection(db, MUTUALS_COLLECTION, mutualId, LOAN_LEDGERS_SUBCOLLECTION),
        where('memberUserIds', 'array-contains', userId)
      )
    )
    if (ledgersSnapshot.empty) return null

    const ledgers = await Promise.all(ledgersSnapshot.docs.map(async (ledgerDoc) => {
      const data = ledgerDoc.data()
      const entriesSnapshot = await getDocs(
        collection(ledgerDoc.ref, ENTRIES_SUBCOLLECTION)
      )
      const entries = entriesSnapshot.docs.flatMap((entryDoc) => {
        const entryData = entryDoc.data()
        const occurredAt = firestoreDate(entryData.occurredAt)
        const amount = numericAmount(entryData.amount)
        if (!occurredAt || amount <= 0) return []

        return [{
          id: entryDoc.id,
          mutualId,
          ledgerId: ledgerDoc.id,
          kind: entryData.kind,
          lenderAccountId: entryData.lenderAccountId,
          lenderAccountTitle: entryData.lenderAccountTitle || 'Unknown',
          lenderAssetId: entryData.lenderAssetId || null,
          lenderAssetTitle: entryData.lenderAssetTitle || null,
          borrowerAccountId: entryData.borrowerAccountId,
          borrowerAccountTitle: entryData.borrowerAccountTitle || 'Unknown',
          borrowerAssetId: entryData.borrowerAssetId || null,
          borrowerAssetTitle: entryData.borrowerAssetTitle || null,
          amount,
          currency: entryData.currency || 'ILS',
          occurredAt,
          createdAt: firestoreDate(entryData.createdAt),
          createdBy: entryData.createdBy || '',
          createdByName: entryData.createdByName || 'Unknown',
          comment: entryData.comment || '',
          sourceOperationId: entryData.sourceOperationId || null,
          targetOperationId: entryData.targetOperationId || null,
        } satisfies LoanEntry]
      }).sort((a, b) => {
        const occurredDifference = b.occurredAt.getTime() - a.occurredAt.getTime()
        if (occurredDifference !== 0) return occurredDifference
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      })

      return {
        id: ledgerDoc.id,
        mutualId,
        lenderAccountId: data.lenderAccountId,
        lenderAccountTitle: data.lenderAccountTitle || 'Unknown',
        borrowerAccountId: data.borrowerAccountId,
        borrowerAccountTitle: data.borrowerAccountTitle || 'Unknown',
        currency: data.currency || 'ILS',
        balance: numericAmount(data.balance),
        createdAt: firestoreDate(data.createdAt),
        updatedAt: firestoreDate(data.updatedAt),
        createdBy: data.createdBy || '',
        memberUserIds: Array.isArray(data.memberUserIds) ? data.memberUserIds : [],
        entries,
      } satisfies LoanLedger
    }))

    return ledgers.sort(
      (a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
    )[0]
  } catch (error) {
    logger.error('Error getting loan ledger:', error)
    throw error
  }
}

export async function applyLoanEntry(
  mutualId: string,
  entry: CreateLoanEntryData
): Promise<LoanEntry> {
  const amount = Math.round(entry.amount * 100) / 100
  const memberUserIds = Array.from(new Set([...entry.memberUserIds, entry.createdBy]))
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Loan amount must be greater than zero.')
  }
  if (entry.lenderAccountId === entry.borrowerAccountId) {
    throw new Error('Lender and borrower must be different accounts.')
  }
  if (Number.isNaN(entry.occurredAt.getTime())) {
    throw new Error('Loan entry date is invalid.')
  }

  const ledgerId = ledgerDocumentId(
    entry.lenderAccountId,
    entry.borrowerAccountId,
    entry.currency
  )
  const ledgerRef = doc(
    db,
    MUTUALS_COLLECTION,
    mutualId,
    LOAN_LEDGERS_SUBCOLLECTION,
    ledgerId
  )
  const entryRef = doc(collection(ledgerRef, ENTRIES_SUBCOLLECTION))
  const movesAssets = entry.kind !== 'opening-balance'

  if (
    movesAssets &&
    (!entry.lenderAssetId || !entry.lenderAssetTitle ||
      !entry.borrowerAssetId || !entry.borrowerAssetTitle)
  ) {
    throw new Error('Both lender and borrower assets are required.')
  }

  const sourceAccountId = entry.kind === 'repayment'
    ? entry.borrowerAccountId
    : entry.lenderAccountId
  const sourceAssetId = entry.kind === 'repayment'
    ? entry.borrowerAssetId
    : entry.lenderAssetId
  const targetAccountId = entry.kind === 'repayment'
    ? entry.lenderAccountId
    : entry.borrowerAccountId
  const targetAssetId = entry.kind === 'repayment'
    ? entry.lenderAssetId
    : entry.borrowerAssetId

  const sourceAssetRef = movesAssets && sourceAssetId
    ? doc(db, ACCOUNTS_COLLECTION, sourceAccountId, ASSETS_SUBCOLLECTION, sourceAssetId)
    : null
  const targetAssetRef = movesAssets && targetAssetId
    ? doc(db, ACCOUNTS_COLLECTION, targetAccountId, ASSETS_SUBCOLLECTION, targetAssetId)
    : null
  const sourceOperationRef = sourceAssetId
    ? doc(collection(
        db,
        ACCOUNTS_COLLECTION,
        sourceAccountId,
        ASSETS_SUBCOLLECTION,
        sourceAssetId,
        OPERATIONS_SUBCOLLECTION
      ))
    : null
  const targetOperationRef = targetAssetId
    ? doc(collection(
        db,
        ACCOUNTS_COLLECTION,
        targetAccountId,
        ASSETS_SUBCOLLECTION,
        targetAssetId,
        OPERATIONS_SUBCOLLECTION
      ))
    : null

  try {
    await runTransaction(db, async (transaction) => {
      const ledgerDoc = await transaction.get(ledgerRef)
      const currentBalance = ledgerDoc.exists()
        ? numericAmount(ledgerDoc.data().balance)
        : 0

      if (entry.kind === 'opening-balance' && ledgerDoc.exists()) {
        throw new Error('Opening balance can only be added to a new loan ledger.')
      }
      if (
        ledgerDoc.exists() &&
        (ledgerDoc.data().lenderAccountId !== entry.lenderAccountId ||
          ledgerDoc.data().borrowerAccountId !== entry.borrowerAccountId)
      ) {
        throw new Error('This account pair already has a loan ledger with opposite roles.')
      }
      if (entry.kind === 'repayment' && !ledgerDoc.exists()) {
        throw new Error('A repayment requires an existing loan balance.')
      }

      const nextBalance = Math.round(
        (currentBalance + balanceDelta(entry.kind, amount)) * 100
      ) / 100
      if (nextBalance < 0) {
        throw new Error('Repayment cannot exceed the current debt.')
      }

      let sourceAmount = 0
      let targetAmount = 0
      if (movesAssets && sourceAssetRef && targetAssetRef) {
        const sourceAssetDoc = await transaction.get(sourceAssetRef)
        const targetAssetDoc = await transaction.get(targetAssetRef)
        if (!sourceAssetDoc.exists() || !targetAssetDoc.exists()) {
          throw new Error('A selected loan asset no longer exists.')
        }
        if (
          sourceAssetDoc.data().currency !== entry.currency ||
          targetAssetDoc.data().currency !== entry.currency
        ) {
          throw new Error(`Both loan assets must use ${entry.currency}.`)
        }
        sourceAmount = numericAmount(sourceAssetDoc.data().amount)
        targetAmount = numericAmount(targetAssetDoc.data().amount)
      }

      const occurredAt = Timestamp.fromDate(entry.occurredAt)
      const entryData = {
        kind: entry.kind,
        lenderAccountId: entry.lenderAccountId,
        lenderAccountTitle: entry.lenderAccountTitle,
        lenderAssetId: entry.lenderAssetId,
        lenderAssetTitle: entry.lenderAssetTitle,
        borrowerAccountId: entry.borrowerAccountId,
        borrowerAccountTitle: entry.borrowerAccountTitle,
        borrowerAssetId: entry.borrowerAssetId,
        borrowerAssetTitle: entry.borrowerAssetTitle,
        amount,
        currency: entry.currency,
        occurredAt,
        createdAt: serverTimestamp(),
        createdBy: entry.createdBy,
        createdByName: entry.createdByName,
        comment: entry.comment,
        sourceOperationId: sourceOperationRef?.id || null,
        targetOperationId: targetOperationRef?.id || null,
      }

      if (ledgerDoc.exists()) {
        if (!ledgerDoc.data().memberUserIds?.includes(entry.createdBy)) {
          throw new Error('You do not have access to this loan ledger.')
        }
        transaction.update(ledgerRef, {
          balance: nextBalance,
          updatedAt: serverTimestamp(),
        })
      } else {
        transaction.set(ledgerRef, {
          lenderAccountId: entry.lenderAccountId,
          lenderAccountTitle: entry.lenderAccountTitle,
          borrowerAccountId: entry.borrowerAccountId,
          borrowerAccountTitle: entry.borrowerAccountTitle,
          currency: entry.currency,
          balance: nextBalance,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: entry.createdBy,
          memberUserIds,
        })
      }
      transaction.set(entryRef, entryData)

      if (
        movesAssets && sourceAssetRef && targetAssetRef &&
        sourceOperationRef && targetOperationRef
      ) {
        const title = entry.kind === 'repayment'
          ? `Loan repayment: ${entry.borrowerAccountTitle} to ${entry.lenderAccountTitle}`
          : `Loan advance: ${entry.lenderAccountTitle} to ${entry.borrowerAccountTitle}`
        const operationBase = {
          type: 'transfer',
          userId: entry.createdBy,
          title,
          amount,
          category: entry.kind === 'repayment' ? 'Loan repayment' : 'Loan advance',
          comment: entry.comment,
          datetime: occurredAt,
          rate: 1,
          loanEntryId: entryRef.id,
        }

        transaction.set(sourceOperationRef, {
          ...operationBase,
          loanDirection: 'outgoing',
          transferTo: {
            accountId: targetAccountId,
            assetId: targetAssetId,
            operationId: targetOperationRef.id,
          },
        })
        transaction.set(targetOperationRef, {
          ...operationBase,
          loanDirection: 'incoming',
          transferTo: {
            accountId: sourceAccountId,
            assetId: sourceAssetId,
            operationId: sourceOperationRef.id,
          },
        })
        transaction.update(sourceAssetRef, { amount: sourceAmount - amount })
        transaction.update(targetAssetRef, { amount: targetAmount + amount })
      }
    })

    return {
      id: entryRef.id,
      mutualId,
      ledgerId,
      ...entry,
      amount,
      createdAt: new Date(),
      sourceOperationId: sourceOperationRef?.id || null,
      targetOperationId: targetOperationRef?.id || null,
    }
  } catch (error) {
    logger.error('Error applying loan entry:', error)
    throw error
  }
}
