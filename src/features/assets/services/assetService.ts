import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Asset } from '@/types'

const ACCOUNTS_COLLECTION = 'accounts'
const ASSETS_SUBCOLLECTION = 'assets'

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
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      accountId,
      ...doc.data(),
    })) as Asset[]
  } catch (error) {
    console.error('Error getting assets:', error)
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
      return {
        id: assetDoc.id,
        accountId,
        ...assetDoc.data(),
      } as Asset
    }
    return null
  } catch (error) {
    console.error('Error getting asset:', error)
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
    console.error('Error getting all assets:', error)
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

