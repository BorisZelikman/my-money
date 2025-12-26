import type { Timestamp } from 'firebase/firestore'

export type OperationType = 'payment' | 'income' | 'transfer'

export interface TransferTo {
  assetId: string
  operationId: string
}

export interface Operation {
  id: string
  type: OperationType
  userId: string
  title: string
  amount: number
  category: string
  comment: string
  datetime: Timestamp
  purposeId?: string
  rate?: number
  transferTo?: TransferTo
}

