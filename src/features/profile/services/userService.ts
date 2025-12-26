import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserPreferences, UserBasic } from '@/types'

const USERS_COLLECTION = 'users'

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserPreferences
    }
    return null
  } catch (error) {
    console.error('Error getting user preferences:', error)
    throw error
  }
}

export async function createUserPreferences(
  userId: string,
  name: string,
  email?: string
): Promise<UserPreferences> {
  try {
    const newUser: Omit<UserPreferences, 'id'> = {
      name: name || email || 'User',
      mainCurrency: 'ILS',
      accounts: [],
      assets: [],
      mutuals: [],
      operationType: 'payment',
      viewMode: 'Accounts',
      lastViewedPage: '/profile',
    }

    await setDoc(doc(db, USERS_COLLECTION, userId), newUser)
    return { id: userId, ...newUser }
  } catch (error) {
    console.error('Error creating user preferences:', error)
    throw error
  }
}

export async function updateUserPreference<K extends keyof UserPreferences>(
  userId: string,
  field: K,
  value: UserPreferences[K]
): Promise<void> {
  try {
    const userDoc = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userDoc, { [field]: value })
  } catch (error) {
    console.error('Error updating user preference:', error)
    throw error
  }
}

export async function getAllUsers(): Promise<UserBasic[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || 'Unknown',
    }))
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

export async function getUsersByIds(userIds: string[]): Promise<UserBasic[]> {
  try {
    const users: UserBasic[] = []
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId))
      if (userDoc.exists()) {
        users.push({
          id: userDoc.id,
          name: userDoc.data().name || 'Unknown',
        })
      }
    }
    return users
  } catch (error) {
    console.error('Error getting users by ids:', error)
    throw error
  }
}

