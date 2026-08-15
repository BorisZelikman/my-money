import type { Timestamp } from 'firebase/firestore'
import type {
  CategoryFieldAggregation,
  CategoryFieldRole,
  CategoryFieldType,
} from './category'

export type OperationType = 'payment' | 'income' | 'transfer'

export interface TransferTo {
  accountId?: string
  assetId: string
  operationId: string
}

export interface FuelDetails {
  unitPrice?: number
  liters?: number
  odometerKm?: number
  fullTank?: boolean
}

export type AdditionalFieldValue = number | string | boolean

export interface OperationAdditionalField {
  definitionId: string
  label: string
  type: CategoryFieldType
  unit?: string
  role: CategoryFieldRole
  aggregation: CategoryFieldAggregation
  value: AdditionalFieldValue
}

export interface Operation {
  id: string
  type: OperationType
  userId: string
  title: string
  amount: number
  category: string
  categoryId?: string
  comment: string
  datetime: Timestamp
  purposeId?: string
  rate?: number
  transferTo?: TransferTo
  settlementId?: string
  settlementDirection?: 'outgoing' | 'incoming'
  loanEntryId?: string
  loanMutualId?: string
  loanLedgerId?: string
  loanDirection?: 'outgoing' | 'incoming'
  fuelDetails?: FuelDetails
  additionalFields?: OperationAdditionalField[]
}
