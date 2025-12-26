import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  documentId,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Account, AccountWithUsers } from '@/types'
import { getUsersByIds } from '@/features/profile/services/userService'

const ACCOUNTS_COLLECTION = 'accounts'

export async function getAccountById(
  accountId: string
): Promise<Account | null> {
  try {
    const accountDoc = await getDoc(doc(db, ACCOUNTS_COLLECTION, accountId))
    if (accountDoc.exists()) {
      return { id: accountDoc.id, ...accountDoc.data() } as Account
    }
    return null
  } catch (error) {
    console.error('Error getting account:', error)
    throw error
  }
}

export async function getAccountsByIds(
  accountIds: string[]
): Promise<Account[]> {
  try {
    if (accountIds.length === 0) return []

    // Firestore 'in' query supports max 10 items, so we batch
    const accounts: Account[] = []
    const batches = []

    for (let i = 0; i < accountIds.length; i += 10) {
      batches.push(accountIds.slice(i, i + 10))
    }

    for (const batch of batches) {
      const q = query(
        collection(db, ACCOUNTS_COLLECTION),
        where(documentId(), 'in', batch)
      )
      const querySnapshot = await getDocs(q)
      querySnapshot.docs.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as Account)
      })
    }

    // Sort by original order
    return accountIds
      .map((id) => accounts.find((a) => a.id === id))
      .filter((a): a is Account => a !== undefined)
  } catch (error) {
    console.error('Error getting accounts:', error)
    throw error
  }
}

export async function getAccountsWithUsers(
  accountIds: string[]
): Promise<AccountWithUsers[]> {
  try {
    const accounts = await getAccountsByIds(accountIds)

    // Get all unique user IDs from accounts
    const allUserIds = [...new Set(accounts.flatMap((a) => a.users))]
    const users = await getUsersByIds(allUserIds)
    const userMap = new Map(users.map((u) => [u.id, u.name]))

    // Map accounts with user names
    return accounts.map((account) => ({
      ...account,
      userNames: account.users.map((uid) => userMap.get(uid) || 'Unknown'),
    }))
  } catch (error) {
    console.error('Error getting accounts with users:', error)
    throw error
  }
}

export async function getAllAccounts(): Promise<Account[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Account[]
  } catch (error) {
    console.error('Error getting all accounts:', error)
    throw error
  }
}

