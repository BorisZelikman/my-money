import type { OperationType } from './operation'

export interface OperationTemplate {
  id: string
  type: Extract<OperationType, 'payment' | 'income'>
  canonicalKey: string
  title: string
  aliases: string[]
  icon: string
  accountId: string
  assetId: string
  category: string
  purposeId?: string
  lastAmount: number
  useCount: number
  firstUsedAt: Date
  lastUsedAt: Date
}

export interface OperationTemplateInput {
  type: Extract<OperationType, 'payment' | 'income'>
  title: string
  amount: number
  category: string
  datetime: Date
  accountId: string
  assetId: string
  purposeId?: string
}

