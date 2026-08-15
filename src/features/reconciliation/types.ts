import type { Operation } from '@/types'

export interface BankTransaction {
  id: string
  rowNumber: number
  date: Date
  description: string
  reference: string
  amount: number
  balance?: number
  isCardSettlement: boolean
}

export interface ReconciliationOperation extends Operation {
  accountId: string
  assetId: string
}

export type ReconciliationStatus =
  | 'matched'
  | 'near-match'
  | 'bank-only'
  | 'app-only'
  | 'card-settlement'

export interface ReconciliationRow {
  id: string
  status: ReconciliationStatus
  bank: BankTransaction | null
  operation: ReconciliationOperation | null
  dayDifference?: number
}
