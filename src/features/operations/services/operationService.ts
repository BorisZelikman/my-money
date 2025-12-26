import {
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  writeBatch,
  Timestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Operation, OperationType } from '@/types'

const ACCOUNTS_COLLECTION = 'accounts'
const ASSETS_SUBCOLLECTION = 'assets'
const OPERATIONS_SUBCOLLECTION = 'operations'

function getOperationsRef(accountId: string, assetId: string) {
  return collection(
    db,
    ACCOUNTS_COLLECTION,
    accountId,
    ASSETS_SUBCOLLECTION,
    assetId,
    OPERATIONS_SUBCOLLECTION
  )
}

export async function getOperationsByAssetId(
  accountId: string,
  assetId: string
): Promise<Operation[]> {
  try {
    const operationsRef = getOperationsRef(accountId, assetId)
    const q = query(operationsRef, orderBy('datetime', 'desc'))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Operation[]
  } catch (error) {
    console.error('Error getting operations:', error)
    throw error
  }
}

export interface NewOperation {
  type: OperationType
  userId: string
  title: string
  amount: number
  category: string
  comment: string
  datetime: Date
}

export async function addOperation(
  accountId: string,
  assetId: string,
  operation: NewOperation
): Promise<string> {
  try {
    const batch = writeBatch(db)

    // Add the operation
    const operationsRef = getOperationsRef(accountId, assetId)
    const operationRef = doc(operationsRef)
    const operationData = {
      ...operation,
      datetime: Timestamp.fromDate(operation.datetime),
    }
    batch.set(operationRef, operationData)

    // Update asset amount
    const assetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId
    )
    const assetDoc = await getDoc(assetRef)
    if (assetDoc.exists()) {
      const currentAmount = assetDoc.data().amount || 0
      const delta = operation.type === 'payment' ? -operation.amount : operation.amount
      batch.update(assetRef, { amount: currentAmount + delta })
    }

    await batch.commit()
    return operationRef.id
  } catch (error) {
    console.error('Error adding operation:', error)
    throw error
  }
}

export async function updateOperation(
  accountId: string,
  assetId: string,
  operationId: string,
  oldOperation: Operation,
  newData: Partial<NewOperation>
): Promise<void> {
  try {
    const batch = writeBatch(db)

    // Update the operation
    const operationRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId,
      OPERATIONS_SUBCOLLECTION,
      operationId
    )
    
    // Build update data with proper typing
    const updateData: Record<string, string | number | Timestamp> = {}
    if (newData.type !== undefined) updateData.type = newData.type
    if (newData.title !== undefined) updateData.title = newData.title
    if (newData.amount !== undefined) updateData.amount = newData.amount
    if (newData.category !== undefined) updateData.category = newData.category
    if (newData.comment !== undefined) updateData.comment = newData.comment
    if (newData.datetime) updateData.datetime = Timestamp.fromDate(newData.datetime)
    if (newData.userId !== undefined) updateData.userId = newData.userId
    
    batch.update(operationRef, updateData)

    // If amount or type changed, update asset amount
    if (newData.amount !== undefined || newData.type !== undefined) {
      const assetRef = doc(
        db,
        ACCOUNTS_COLLECTION,
        accountId,
        ASSETS_SUBCOLLECTION,
        assetId
      )
      const assetDoc = await getDoc(assetRef)
      if (assetDoc.exists()) {
        const currentAmount = assetDoc.data().amount || 0
        
        // Reverse old operation effect
        const oldDelta = oldOperation.type === 'payment' ? -oldOperation.amount : oldOperation.amount
        
        // Apply new operation effect
        const newType = newData.type || oldOperation.type
        const newAmount = newData.amount ?? oldOperation.amount
        const newDelta = newType === 'payment' ? -newAmount : newAmount
        
        batch.update(assetRef, { amount: currentAmount - oldDelta + newDelta })
      }
    }

    await batch.commit()
  } catch (error) {
    console.error('Error updating operation:', error)
    throw error
  }
}

export async function deleteOperation(
  accountId: string,
  assetId: string,
  operation: Operation
): Promise<void> {
  try {
    const batch = writeBatch(db)

    // Delete the operation
    const operationRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId,
      OPERATIONS_SUBCOLLECTION,
      operation.id
    )
    batch.delete(operationRef)

    // Reverse the operation effect on asset
    const assetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      accountId,
      ASSETS_SUBCOLLECTION,
      assetId
    )
    const assetDoc = await getDoc(assetRef)
    if (assetDoc.exists()) {
      const currentAmount = assetDoc.data().amount || 0
      const delta = operation.type === 'payment' ? -operation.amount : operation.amount
      batch.update(assetRef, { amount: currentAmount - delta })
    }

    await batch.commit()
  } catch (error) {
    console.error('Error deleting operation:', error)
    throw error
  }
}

export async function getUniqueCategories(
  accountId: string,
  assetId: string
): Promise<string[]> {
  try {
    const operations = await getOperationsByAssetId(accountId, assetId)
    const categories = new Set(operations.map((op) => op.category).filter(Boolean))
    return Array.from(categories).sort()
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
}

