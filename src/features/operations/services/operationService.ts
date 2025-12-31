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
import { logger } from '@/utils/logger'
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

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Ensure amount is a number (database may store as string)
        amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      }
    }) as Operation[]
  } catch (error) {
    logger.error('Error getting operations:', error)
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
  purposeId?: string
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
    
    // Build operation data, excluding undefined values
    const operationData: Record<string, unknown> = {
      type: operation.type,
      userId: operation.userId,
      title: operation.title,
      amount: operation.amount,
      category: operation.category,
      comment: operation.comment,
      datetime: Timestamp.fromDate(operation.datetime),
    }
    
    // Only add purposeId if it's defined and not empty
    if (operation.purposeId) {
      operationData.purposeId = operation.purposeId
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
      const currentAmount = parseFloat(assetDoc.data().amount) || 0
      const delta = operation.type === 'payment' ? -operation.amount : operation.amount
      batch.update(assetRef, { amount: currentAmount + delta })
    }

    await batch.commit()
    return operationRef.id
  } catch (error) {
    logger.error('Error adding operation:', error)
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
    const updateData: Record<string, string | number | Timestamp | null> = {}
    if (newData.type !== undefined) updateData.type = newData.type
    if (newData.title !== undefined) updateData.title = newData.title
    if (newData.amount !== undefined) updateData.amount = newData.amount
    if (newData.category !== undefined) updateData.category = newData.category
    if (newData.comment !== undefined) updateData.comment = newData.comment
    if (newData.datetime) updateData.datetime = Timestamp.fromDate(newData.datetime)
    if (newData.userId !== undefined) updateData.userId = newData.userId
    // Handle purposeId - can be set to a value or cleared (null)
    if (newData.purposeId !== undefined) {
      updateData.purposeId = newData.purposeId || null
    }
    
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
        const currentAmount = parseFloat(assetDoc.data().amount) || 0
        
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
    logger.error('Error updating operation:', error)
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
      const currentAmount = parseFloat(assetDoc.data().amount) || 0
      const delta = operation.type === 'payment' ? -operation.amount : operation.amount
      batch.update(assetRef, { amount: currentAmount - delta })
    }

    await batch.commit()
  } catch (error) {
    logger.error('Error deleting operation:', error)
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
    logger.error('Error getting categories:', error)
    return []
  }
}

export interface TransferData {
  userId: string
  title: string
  amount: number
  comment: string
  datetime: Date
  rate: number
  targetAccountId: string
  targetAssetId: string
}

export async function createTransfer(
  fromAccountId: string,
  fromAssetId: string,
  transfer: TransferData
): Promise<{ fromOperationId: string; toOperationId: string }> {
  try {
    const batch = writeBatch(db)

    // Source operation (outgoing transfer)
    const fromOperationsRef = getOperationsRef(fromAccountId, fromAssetId)
    const fromOperationRef = doc(fromOperationsRef)
    
    // Target operation (incoming transfer)
    const toOperationsRef = getOperationsRef(transfer.targetAccountId, transfer.targetAssetId)
    const toOperationRef = doc(toOperationsRef)

    const targetAmount = transfer.amount * transfer.rate

    // Create source operation
    const fromOperationData = {
      type: 'transfer' as OperationType,
      userId: transfer.userId,
      title: transfer.title,
      amount: transfer.amount,
      category: 'Transfer',
      comment: transfer.comment,
      datetime: Timestamp.fromDate(transfer.datetime),
      rate: transfer.rate,
      transferTo: {
        assetId: transfer.targetAssetId,
        operationId: toOperationRef.id,
      },
    }
    batch.set(fromOperationRef, fromOperationData)

    // Create target operation
    const toOperationData = {
      type: 'transfer' as OperationType,
      userId: transfer.userId,
      title: transfer.title,
      amount: targetAmount,
      category: 'Transfer',
      comment: transfer.comment,
      datetime: Timestamp.fromDate(transfer.datetime),
      rate: 1 / transfer.rate,
      transferTo: {
        assetId: fromAssetId,
        operationId: fromOperationRef.id,
      },
    }
    batch.set(toOperationRef, toOperationData)

    // Update source asset (decrease)
    const fromAssetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      fromAccountId,
      ASSETS_SUBCOLLECTION,
      fromAssetId
    )
    const fromAssetDoc = await getDoc(fromAssetRef)
    if (fromAssetDoc.exists()) {
      const currentAmount = parseFloat(fromAssetDoc.data().amount) || 0
      batch.update(fromAssetRef, { amount: currentAmount - transfer.amount })
    }

    // Update target asset (increase)
    const toAssetRef = doc(
      db,
      ACCOUNTS_COLLECTION,
      transfer.targetAccountId,
      ASSETS_SUBCOLLECTION,
      transfer.targetAssetId
    )
    const toAssetDoc = await getDoc(toAssetRef)
    if (toAssetDoc.exists()) {
      const currentAmount = toAssetDoc.data().amount || 0
      batch.update(toAssetRef, { amount: currentAmount + targetAmount })
    }

    await batch.commit()
    return {
      fromOperationId: fromOperationRef.id,
      toOperationId: toOperationRef.id,
    }
  } catch (error) {
    logger.error('Error creating transfer:', error)
    throw error
  }
}

export interface DateRange {
  from: Date
  to: Date
}

export async function getOperationsByDateRange(
  accountId: string,
  assetId: string,
  dateRange: DateRange
): Promise<Operation[]> {
  try {
    const operationsRef = getOperationsRef(accountId, assetId)
    const q = query(operationsRef, orderBy('datetime', 'desc'))
    const querySnapshot = await getDocs(q)

    const fromTimestamp = Timestamp.fromDate(dateRange.from)
    const toTimestamp = Timestamp.fromDate(dateRange.to)

    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Operation)
      .filter((op) => {
        const opTimestamp = op.datetime
        return opTimestamp >= fromTimestamp && opTimestamp <= toTimestamp
      })
  } catch (error) {
    logger.error('Error getting operations by date range:', error)
    throw error
  }
}

export function calculateTotals(operations: Operation[]): {
  income: number
  expenses: number
  transfers: number
  balance: number
} {
  let income = 0
  let expenses = 0
  let transfers = 0

  for (const op of operations) {
    if (op.type === 'income') {
      income += op.amount
    } else if (op.type === 'payment') {
      expenses += op.amount
    } else if (op.type === 'transfer') {
      transfers += op.amount
    }
  }

  return {
    income,
    expenses,
    transfers,
    balance: income - expenses,
  }
}

