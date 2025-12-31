import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type {
  Mutual,
  MutualParticipant,
  MutualPurpose,
  MutualOperation,
  SettlementData,
} from '@/types'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import { getOperationsByAssetId } from '@/features/operations/services/operationService'
import { getUsersByIds } from '@/features/profile/services/userService'

const MUTUALS_COLLECTION = 'mutuals'
const PARTICIPANTS_SUBCOLLECTION = 'participants'
const PURPOSES_SUBCOLLECTION = 'purposes'
const ACCOUNTS_COLLECTION = 'accounts'

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
  accountTitles: Record<string, string>
): SettlementData[] {
  // Calculate total expenses per account
  const expensesByAccount: Record<string, number> = {}
  let totalExpenses = 0

  for (const op of operations) {
    if (op.type === 'payment') {
      if (!expensesByAccount[op.accountId]) {
        expensesByAccount[op.accountId] = 0
      }
      expensesByAccount[op.accountId] += op.amount
      totalExpenses += op.amount
    }
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
      owes: expectedShare - actualPayments,
    }
  })

  return settlements
}

export function getSettlementPurpose(mutual: Mutual): MutualPurpose | null {
  return mutual.purposes.find((p) => p.isSettlement) || null
}

