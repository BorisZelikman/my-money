import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type { Asset } from '@/types'

const ACCOUNTS_COLLECTION = 'accounts'
const ASSETS_SUBCOLLECTION = 'assets'
const OPERATIONS_SUBCOLLECTION = 'operations'

export async function getAssetsByAccountId(
  accountId: string
): Promise<Asset[]> {
  try {
    const assetsRef = collection(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION
    )
    const querySnapshot = await getDocs(assetsRef)
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        accountId,
        ...data,
        // Ensure amount is a number (database may store as string)
        amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0),
      }
    }) as Asset[]
  } catch (error) {
    logger.error('Error getting assets:', error)
    throw error
  }
}

export async function getAssetById(
  accountId: string,
  assetId: string
): Promise<Asset | null> {
  try {
    const assetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId
    )
    const assetDoc = await getDoc(assetRef)
    
    if (assetDoc.exists()) {
      const data = assetDoc.data()
      return {
        id: assetDoc.id,
        accountId,
        ...data,
        // Ensure amount is a number (database may store as string)
        amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0),
      } as Asset
    }
    return null
  } catch (error) {
    logger.error('Error getting asset:', error)
    throw error
  }
}

export async function getAllAssetsForAccounts(
  accountIds: string[]
): Promise<Asset[]> {
  try {
    const allAssets: Asset[] = []
    
    for (const accountId of accountIds) {
      const assets = await getAssetsByAccountId(accountId)
      allAssets.push(...assets)
    }
    
    return allAssets
  } catch (error) {
    logger.error('Error getting all assets:', error)
    throw error
  }
}

export function calculateTotalAmount(
  assets: Asset[],
  currency?: string
): number {
  if (currency) {
    return assets
      .filter((a) => a.currency === currency)
      .reduce((sum, a) => sum + a.amount, 0)
  }
  return assets.reduce((sum, a) => sum + a.amount, 0)
}

export async function createAsset(
  accountId: string,
  data: {
    title: string
    currency: string
    amount: number
    comment?: string
  }
): Promise<Asset> {
  try {
    const assetsRef = collection(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION
    )
    const assetRef = doc(assetsRef)
    const newAsset = {
      title: data.title,
      currency: data.currency,
      amount: data.amount,
      comment: data.comment || '',
    }
    await setDoc(assetRef, newAsset)
    return { id: assetRef.id, accountId, ...newAsset }
  } catch (error) {
    logger.error('Error creating asset:', error)
    throw error
  }
}

export async function updateAsset(
  accountId: string,
  assetId: string,
  data: Partial<Pick<Asset, 'title' | 'currency' | 'amount' | 'comment'>>
): Promise<void> {
  try {
    const assetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId
    )
    await updateDoc(assetRef, data)
  } catch (error) {
    logger.error('Error updating asset:', error)
    throw error
  }
}

export async function deleteAsset(
  accountId: string,
  assetId: string
): Promise<void> {
  try {
    // First delete all operations in this asset
    const operationsRef = collection(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId,
      OPERATIONS_SUBCOLLECTION
    )
    const operationsSnapshot = await getDocs(operationsRef)
    for (const opDoc of operationsSnapshot.docs) {
      await deleteDoc(opDoc.ref)
    }
    // Then delete the asset
    const assetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId
    )
    await deleteDoc(assetRef)
  } catch (error) {
    logger.error('Error deleting asset:', error)
    throw error
  }
}

