import type { OperationType } from './operation'

export interface OperationTemplateCommentSuggestion {
  text: string
  count: number
  lastUsedAt: Date
}

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
  commentSuggestions: OperationTemplateCommentSuggestion[]
  firstUsedAt: Date
  lastUsedAt: Date
}

export interface OperationTemplateInput {
  type: Extract<OperationType, 'payment' | 'income'>
  title: string
  amount: number
  category: string
  comment: string
  datetime: Date
  accountId: string
  assetId: string
  purposeId?: string
}
