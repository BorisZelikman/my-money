export type CategoryType = 'expense' | 'income' | 'both'
export type CategoryFieldType = 'number' | 'text' | 'boolean' | 'date'
export type CategoryFieldRole =
  | 'quantity'
  | 'unitPrice'
  | 'cumulativeReading'
  | 'flag'
  | 'note'
export type CategoryFieldAggregation = 'sum' | 'average' | 'last' | 'delta'

export interface CategoryFieldDefinition {
  id: string
  label: string
  type: CategoryFieldType
  unit?: string
  required: boolean
  role: CategoryFieldRole
  aggregation: CategoryFieldAggregation
}

export interface Category {
  id: string
  accountId: string
  title: string
  parentCategoryId: string | null
  type: CategoryType
  sortOrder: number
  fieldDefinitions: CategoryFieldDefinition[]
}

export interface CategoryInput {
  title: string
  parentCategoryId: string | null
  type: CategoryType
  sortOrder?: number
  fieldDefinitions?: CategoryFieldDefinition[]
}
