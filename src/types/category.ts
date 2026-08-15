export type CategoryType = 'expense' | 'income' | 'both'

export interface Category {
  id: string
  accountId: string
  title: string
  parentCategoryId: string | null
  type: CategoryType
  sortOrder: number
}

export interface CategoryInput {
  title: string
  parentCategoryId: string | null
  type: CategoryType
  sortOrder?: number
}
