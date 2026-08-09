import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type {
  Mutual,
  MutualParticipant,
  MutualPurpose,
  MutualOperation,
  SettlementData,
  AppliedSettlement,
  ApplySettlementTransferData,
} from '@/types'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import { getOperationsByAssetId } from '@/features/operations/services/operationService'
import { getUsersByIds } from '@/features/profile/services/userService'

const MUTUALS_COLLECTION = 'mutuals'
const PARTICIPANTS_SUBCOLLECTION = 'participants'
const PURPOSES_SUBCOLLECTION = 'purposes'
const SETTLEMENTS_SUBCOLLECTION = 'settlements'
const ACCOUNTS_COLLECTION = 'accounts'
const ASSETS_SUBCOLLECTION = 'assets'
const OPERATIONS_SUBCOLLECTION = 'operations'

export async function getMutual(mutualId: string): Promise<Mutual | null> {
  try {
    const mutualDoc = await getDoc(doc(db, MUTUALS_COLLECTION, mutualId))
    if (!mutualDoc.exists()) return null

    const participants = await getParticipants(mutualId)
    const purposes = await getPurposes(mutualId)

    return {
      id: mutualDoc.id,
      title: mutualDoc.data().title || 'Mutual',
      participants,
      purposes,
    }
  } catch (error) {
    logger.error('Error getting mutual:', error)
    throw error
  }
}

export async function getMutualsByIds(mutualIds: string[]): Promise<Mutual[]> {
  try {
    const mutuals: Mutual[] = []
    
    for (const mutualId of mutualIds) {
      const mutual = await getMutual(mutualId)
      if (mutual) {
        mutuals.push(mutual)
      }
    }
    
    return mutuals
  } catch (error) {
    logger.error('Error getting mutuals by IDs:', error)
    throw error
  }
}

export async function getMutualIdsByAccountIds(
  accountIds: string[]
): Promise<string[]> {
  const uniqueAccountIds = Array.from(new Set(accountIds.filter(Boolean)))
  const mutualIds = new Set<string>()

  for (let index = 0; index < uniqueAccountIds.length; index += 10) {
    const accountIdBatch = uniqueAccountIds.slice(index, index + 10)
    const snapshot = await getDocs(
      query(
        collectionGroup(db, PARTICIPANTS_SUBCOLLECTION),
        where('accountId', 'in', accountIdBatch)
      )
    )

    for (const participantDoc of snapshot.docs) {
      const mutualDoc = participantDoc.ref.parent.parent
      if (mutualDoc) mutualIds.add(mutualDoc.id)
    }
  }

  return Array.from(mutualIds)
}

export async function getParticipants(
  mutualId: string
): Promise<MutualParticipant[]> {
  try {
    const participantsRef = collection(
      db,
      MUTUALS_COLLECTION,
      mutualId,
      PARTICIPANTS_SUBCOLLECTION
    )
    const querySnapshot = await getDocs(participantsRef)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      // Ensure rate is a number (database may store as string)
      const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : (data.rate || 1)
      return {
        id: doc.id,
        accountId: data.accountId,
        rate: isNaN(rate) ? 1 : rate,
      }
    })
  } catch (error) {
    logger.error('Error getting participants:', error)
    throw error
  }
}

export async function getPurposes(mutualId: string): Promise<MutualPurpose[]> {
  try {
    const purposesRef = collection(
      db,
      MUTUALS_COLLECTION,
      mutualId,
      PURPOSES_SUBCOLLECTION
    )
    const querySnapshot = await getDocs(purposesRef)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || '',
      icon: doc.data().icon || '📋',
      isSettlement: doc.data().isSettlement || false,
    }))
  } catch (error) {
    logger.error('Error getting purposes:', error)
    throw error
  }
}

export async function getMutualOperations(
  mutualId: string,
  dateRange?: { from: Date; to: Date }
): Promise<MutualOperation[]> {
  try {
    const mutual = await getMutual(mutualId)
    if (!mutual) return []

    const operations: MutualOperation[] = []

    // Get account titles
    const accountTitles: Record<string, string> = {}
    for (const participant of mutual.participants) {
      const accountDoc = await getDoc(
        doc(db, ACCOUNTS_COLLECTION, participant.accountId)
      )
      if (accountDoc.exists()) {
        accountTitles[participant.accountId] = accountDoc.data().title || 'Unknown'
      }
    }

    // Get purpose titles and icons
    const purposeTitles: Record<string, string> = {}
    const purposeIcons: Record<string, string> = {}
    for (const purpose of mutual.purposes) {
      purposeTitles[purpose.id] = purpose.title
      purposeIcons[purpose.id] = purpose.icon || ''
    }

    // Get all users for name lookup
    const allUserIds = new Set<string>()

    // Load operations from all participant accounts
    for (const participant of mutual.participants) {
      const assets = await getAssetsByAccountId(participant.accountId)

      for (const asset of assets) {
        const assetOperations = await getOperationsByAssetId(
          participant.accountId,
          asset.id
        )

        for (const op of assetOperations) {
          // Only include operations with a purposeId
          if (op.purposeId) {
            allUserIds.add(op.userId)
            const opDate = op.datetime.toDate()

            // Apply date filter if provided
            if (dateRange) {
              if (opDate < dateRange.from || opDate > dateRange.to) continue
            }

            // Ensure amount is a number
            const amount = typeof op.amount === 'string' ? parseFloat(op.amount) : (op.amount || 0)

            operations.push({
              id: op.id,
              accountId: participant.accountId,
              assetId: asset.id,
              assetTitle: asset.title,
              accountTitle: accountTitles[participant.accountId] || 'Unknown',
              userId: op.userId,
              userName: '', // Will be filled later
              type: op.type,
              title: op.title,
              amount,
              category: op.category,
              comment: op.comment,
              datetime: opDate,
              purposeId: op.purposeId,
              purposeTitle: purposeTitles[op.purposeId] || 'Unknown',
              purposeIcon: purposeIcons[op.purposeId] || '',
              settlementId: op.settlementId,
              settlementDirection: op.settlementDirection,
            })
          }
        }
      }
    }

    // Get user names
    const users = await getUsersByIds(Array.from(allUserIds))
    const userNames: Record<string, string> = {}
    for (const user of users) {
      userNames[user.id] = user.name
    }

    // Fill in user names
    for (const op of operations) {
      op.userName = userNames[op.userId] || 'Unknown'
    }

    // Sort by date descending
    operations.sort((a, b) => b.datetime.getTime() - a.datetime.getTime())

    return operations
  } catch (error) {
    logger.error('Error getting mutual operations:', error)
    throw error
  }
}

export function calculateSettlement(
  mutual: Mutual,
  operations: MutualOperation[],
  accountTitles: Record<string, string>,
  appliedSettlements: AppliedSettlement[] = []
): SettlementData[] {
  // Calculate total expenses per account
  const expensesByAccount: Record<string, number> = {}
  let totalExpenses = 0

  const settlementPurposeIds = new Set(
    mutual.purposes.filter((purpose) => purpose.isSettlement).map((purpose) => purpose.id)
  )

  for (const op of operations) {
    if (op.type === 'payment' && !settlementPurposeIds.has(op.purposeId)) {
      if (!expensesByAccount[op.accountId]) {
        expensesByAccount[op.accountId] = 0
      }
      expensesByAccount[op.accountId] += op.amount
      totalExpenses += op.amount
    }
  }

  const settlementAdjustments: Record<string, number> = {}
  for (const settlement of appliedSettlements) {
    settlementAdjustments[settlement.fromAccountId] =
      (settlementAdjustments[settlement.fromAccountId] || 0) - settlement.amount
    settlementAdjustments[settlement.toAccountId] =
      (settlementAdjustments[settlement.toAccountId] || 0) + settlement.amount
  }

  // Calculate total rate sum
  const totalRate = mutual.participants.reduce((sum, p) => sum + p.rate, 0)

  // Calculate settlement for each participant
  const settlements: SettlementData[] = mutual.participants.map((participant) => {
    const actualPayments = expensesByAccount[participant.accountId] || 0
    const expectedShare = (participant.rate / totalRate) * totalExpenses

    return {
      accountId: participant.accountId,
      accountTitle: accountTitles[participant.accountId] || 'Unknown',
      rate: participant.rate,
      totalExpenses,
      expectedShare,
      actualPayments,
      owes:
        expectedShare -
        actualPayments +
        (settlementAdjustments[participant.accountId] || 0),
    }
  })

  return settlements
}

function firestoreDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

export async function getAppliedSettlements(
  mutualId: string
): Promise<AppliedSettlement[]> {
  try {
    const snapshot = await getDocs(
      collection(db, MUTUALS_COLLECTION, mutualId, SETTLEMENTS_SUBCOLLECTION)
    )

    const settlements = snapshot.docs.flatMap((settlementDoc) => {
      const data = settlementDoc.data()
      const appliedAt = firestoreDate(data.appliedAt)
      const amount =
        typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount

      if (!appliedAt || !Number.isFinite(amount) || amount <= 0) return []

      return [{
        id: settlementDoc.id,
        mutualId,
        fromAccountId: data.fromAccountId || '',
        fromAccountTitle: data.fromAccountTitle || 'Unknown',
        fromAssetId: data.fromAssetId || null,
        fromAssetTitle: data.fromAssetTitle || null,
        toAccountId: data.toAccountId || '',
        toAccountTitle: data.toAccountTitle || 'Unknown',
        toAssetId: data.toAssetId || null,
        toAssetTitle: data.toAssetTitle || null,
        amount,
        appliedAt,
        createdAt: firestoreDate(data.createdAt),
        createdBy: data.createdBy || '',
        createdByName: data.createdByName || 'Unknown',
        settlementPurposeId: data.settlementPurposeId || '',
        scopePurposeId: data.scopePurposeId || null,
        scopePurposeTitle: data.scopePurposeTitle || 'All purposes',
        sourceOperationId: data.sourceOperationId || null,
        targetOperationId: data.targetOperationId || null,
        isLegacy: false,
      } satisfies AppliedSettlement]
    })

    return settlements.sort((a, b) => {
      const appliedDifference = b.appliedAt.getTime() - a.appliedAt.getTime()
      if (appliedDifference !== 0) return appliedDifference
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    })
  } catch (error) {
    logger.error('Error getting applied settlements:', error)
    throw error
  }
}

export function getLegacySettlements(
  mutual: Mutual,
  operations: MutualOperation[],
  accountTitles: Record<string, string>
): AppliedSettlement[] {
  if (mutual.participants.length !== 2) return []

  const settlementPurposeIds = new Set(
    mutual.purposes.filter((purpose) => purpose.isSettlement).map((purpose) => purpose.id)
  )

  return operations.flatMap((operation) => {
    if (!settlementPurposeIds.has(operation.purposeId)) return []
    if (operation.type !== 'payment' && operation.type !== 'income') return []

    const otherParticipant = mutual.participants.find(
      (participant) => participant.accountId !== operation.accountId
    )
    if (!otherParticipant) return []

    const isPayment = operation.type === 'payment'
    const fromAccountId = isPayment ? operation.accountId : otherParticipant.accountId
    const toAccountId = isPayment ? otherParticipant.accountId : operation.accountId

    return [{
      id: `legacy-${operation.accountId}-${operation.assetId}-${operation.id}`,
      mutualId: mutual.id,
      fromAccountId,
      fromAccountTitle:
        isPayment
          ? operation.accountTitle
          : accountTitles[otherParticipant.accountId] || 'Unknown',
      fromAssetId: isPayment ? operation.assetId : null,
      fromAssetTitle: isPayment ? operation.assetTitle : null,
      toAccountId,
      toAccountTitle:
        isPayment
          ? accountTitles[otherParticipant.accountId] || 'Unknown'
          : operation.accountTitle,
      toAssetId: isPayment ? null : operation.assetId,
      toAssetTitle: isPayment ? null : operation.assetTitle,
      amount: operation.amount,
      appliedAt: operation.datetime,
      createdAt: null,
      createdBy: operation.userId,
      createdByName: operation.userName,
      settlementPurposeId: operation.purposeId,
      scopePurposeId: null,
      scopePurposeTitle: 'All purposes',
      sourceOperationId: isPayment ? operation.id : null,
      targetOperationId: isPayment ? null : operation.id,
      isLegacy: true,
    } satisfies AppliedSettlement]
  }).sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
}

export async function applySettlementTransfer(
  mutualId: string,
  settlement: ApplySettlementTransferData
): Promise<AppliedSettlement> {
  const amount = Math.round(settlement.amount * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Settlement amount must be greater than zero.')
  }
  if (settlement.fromAccountId === settlement.toAccountId) {
    throw new Error('Settlement accounts must be different.')
  }
  if (Number.isNaN(settlement.appliedAt.getTime())) {
    throw new Error('Settlement date is invalid.')
  }

  const settlementRef = doc(
    collection(db, MUTUALS_COLLECTION, mutualId, SETTLEMENTS_SUBCOLLECTION)
  )
  const sourceOperationRef = doc(
    collection(
      db,
      ACCOUNTS_COLLECTION,
      settlement.fromAccountId,
      ASSETS_SUBCOLLECTION,
      settlement.fromAssetId,
      OPERATIONS_SUBCOLLECTION
    )
  )
  const targetOperationRef = doc(
    collection(
      db,
      ACCOUNTS_COLLECTION,
      settlement.toAccountId,
      ASSETS_SUBCOLLECTION,
      settlement.toAssetId,
      OPERATIONS_SUBCOLLECTION
    )
  )
  const sourceAssetRef = doc(
    db,
    ACCOUNTS_COLLECTION,
    settlement.fromAccountId,
    ASSETS_SUBCOLLECTION,
    settlement.fromAssetId
  )
  const targetAssetRef = doc(
    db,
    ACCOUNTS_COLLECTION,
    settlement.toAccountId,
    ASSETS_SUBCOLLECTION,
    settlement.toAssetId
  )

  try {
    await runTransaction(db, async (transaction) => {
      const sourceAssetDoc = await transaction.get(sourceAssetRef)
      const targetAssetDoc = await transaction.get(targetAssetRef)
      if (!sourceAssetDoc.exists() || !targetAssetDoc.exists()) {
        throw new Error('A selected settlement asset no longer exists.')
      }

      const sourceCurrency = sourceAssetDoc.data().currency || 'ILS'
      const targetCurrency = targetAssetDoc.data().currency || 'ILS'
      if (sourceCurrency !== 'ILS' || targetCurrency !== 'ILS') {
        throw new Error('Settlement assets must use ILS.')
      }

      const sourceAmount = parseFloat(sourceAssetDoc.data().amount) || 0
      const targetAmount = parseFloat(targetAssetDoc.data().amount) || 0
      const datetime = Timestamp.fromDate(settlement.appliedAt)
      const operationTitle = `Settlement: ${settlement.fromAccountTitle} to ${settlement.toAccountTitle}`

      transaction.set(sourceOperationRef, {
        type: 'transfer',
        userId: settlement.createdBy,
        title: operationTitle,
        amount,
        category: 'Settlement',
        comment: settlement.scopePurposeTitle,
        datetime,
        rate: 1,
        purposeId: settlement.settlementPurposeId,
        settlementId: settlementRef.id,
        settlementDirection: 'outgoing',
        transferTo: {
          accountId: settlement.toAccountId,
          assetId: settlement.toAssetId,
          operationId: targetOperationRef.id,
        },
      })
      transaction.set(targetOperationRef, {
        type: 'transfer',
        userId: settlement.createdBy,
        title: operationTitle,
        amount,
        category: 'Settlement',
        comment: settlement.scopePurposeTitle,
        datetime,
        rate: 1,
        purposeId: settlement.settlementPurposeId,
        settlementId: settlementRef.id,
        settlementDirection: 'incoming',
        transferTo: {
          accountId: settlement.fromAccountId,
          assetId: settlement.fromAssetId,
          operationId: sourceOperationRef.id,
        },
      })
      transaction.update(sourceAssetRef, { amount: sourceAmount - amount })
      transaction.update(targetAssetRef, { amount: targetAmount + amount })
      transaction.set(settlementRef, {
        ...settlement,
        amount,
        appliedAt: datetime,
        createdAt: serverTimestamp(),
        sourceOperationId: sourceOperationRef.id,
        targetOperationId: targetOperationRef.id,
      })
    })

    return {
      id: settlementRef.id,
      mutualId,
      ...settlement,
      amount,
      createdAt: new Date(),
      sourceOperationId: sourceOperationRef.id,
      targetOperationId: targetOperationRef.id,
      isLegacy: false,
    }
  } catch (error) {
    logger.error('Error applying settlement transfer:', error)
    throw error
  }
}

export function getSettlementPurpose(mutual: Mutual): MutualPurpose | null {
  return mutual.purposes.find((p) => p.isSettlement) || null
}

export async function createMutual(
  title: string,
  participants: { accountId: string; rate: number }[]
): Promise<Mutual> {
  try {
    const batch = writeBatch(db)
    
    // Create the mutual document
    const mutualRef = doc(collection(db, MUTUALS_COLLECTION))
    batch.set(mutualRef, { title })
    
    // Create participant documents
    const participantsData: MutualParticipant[] = []
    for (const participant of participants) {
      const participantRef = doc(
        collection(db, MUTUALS_COLLECTION, mutualRef.id, PARTICIPANTS_SUBCOLLECTION)
      )
      batch.set(participantRef, {
        accountId: participant.accountId,
        rate: participant.rate,
      })
      participantsData.push({
        id: participantRef.id,
        accountId: participant.accountId,
        rate: participant.rate,
      })
    }
    
    await batch.commit()
    
    return {
      id: mutualRef.id,
      title,
      participants: participantsData,
      purposes: [],
    }
  } catch (error) {
    logger.error('Error creating mutual:', error)
    throw error
  }
}

export async function updateMutual(
  mutualId: string,
  title: string,
  participants: { accountId: string; rate: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    // Update mutual title
    const mutualRef = doc(db, MUTUALS_COLLECTION, mutualId)
    batch.update(mutualRef, { title })
    
    // Delete existing participants
    const participantsRef = collection(
      db,
      MUTUALS_COLLECTION,
      mutualId,
      PARTICIPANTS_SUBCOLLECTION
    )
    const existingParticipants = await getDocs(participantsRef)
    for (const participantDoc of existingParticipants.docs) {
      batch.delete(participantDoc.ref)
    }
    
    // Create new participant documents
    for (const participant of participants) {
      const participantRef = doc(
        collection(db, MUTUALS_COLLECTION, mutualId, PARTICIPANTS_SUBCOLLECTION)
      )
      batch.set(participantRef, {
        accountId: participant.accountId,
        rate: participant.rate,
      })
    }
    
    await batch.commit()
  } catch (error) {
    logger.error('Error updating mutual:', error)
    throw error
  }
}

export async function deleteMutual(mutualId: string): Promise<void> {
  try {
    // Delete participants
    const participantsRef = collection(
      db,
      MUTUALS_COLLECTION,
      mutualId,
      PARTICIPANTS_SUBCOLLECTION
    )
    const participantsSnapshot = await getDocs(participantsRef)
    for (const participantDoc of participantsSnapshot.docs) {
      await deleteDoc(participantDoc.ref)
    }
    
    // Delete purposes
    const purposesRef = collection(
      db,
      MUTUALS_COLLECTION,
      mutualId,
      PURPOSES_SUBCOLLECTION
    )
    const purposesSnapshot = await getDocs(purposesRef)
    for (const purposeDoc of purposesSnapshot.docs) {
      await deleteDoc(purposeDoc.ref)
    }
    
    // Delete the mutual document
    await deleteDoc(doc(db, MUTUALS_COLLECTION, mutualId))
  } catch (error) {
    logger.error('Error deleting mutual:', error)
    throw error
  }
}

