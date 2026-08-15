import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Category,
  CategoryFieldAggregation,
  CategoryFieldDefinition,
  CategoryFieldRole,
  CategoryFieldType,
  CategoryInput,
  CategoryType,
} from '@/types'

function categoriesRef(accountId: string) {
  return collection(db, 'accounts', accountId, 'categories')
}

function normalizeType(value: unknown): CategoryType {
  return value === 'expense' || value === 'income' ? value : 'both'
}

const FIELD_TYPES = new Set<CategoryFieldType>(['number', 'text', 'boolean', 'date'])
const FIELD_ROLES = new Set<CategoryFieldRole>([
  'quantity', 'unitPrice', 'cumulativeReading', 'flag', 'note',
])
const FIELD_AGGREGATIONS = new Set<CategoryFieldAggregation>([
  'sum', 'average', 'last', 'delta',
])

function normalizeFieldDefinitions(value: unknown): CategoryFieldDefinition[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const field = item as Record<string, unknown>
    const id = typeof field.id === 'string' ? field.id.trim() : ''
    const label = typeof field.label === 'string' ? field.label.trim() : ''
    if (!id || !label) return []
    const type = FIELD_TYPES.has(field.type as CategoryFieldType)
      ? field.type as CategoryFieldType
      : 'text'
    const role = FIELD_ROLES.has(field.role as CategoryFieldRole)
      ? field.role as CategoryFieldRole
      : 'note'
    const aggregation = FIELD_AGGREGATIONS.has(field.aggregation as CategoryFieldAggregation)
      ? field.aggregation as CategoryFieldAggregation
      : role === 'quantity' ? 'sum'
        : role === 'unitPrice' ? 'average'
          : role === 'cumulativeReading' ? 'delta'
            : 'last'
    return [{
      id,
      label,
      type,
      ...(typeof field.unit === 'string' && field.unit.trim()
        ? { unit: field.unit.trim() }
        : {}),
      required: field.required === true,
      role,
      aggregation,
    }]
  })
}

export async function getCategories(accountId: string): Promise<Category[]> {
  const snapshot = await getDocs(query(categoriesRef(accountId), orderBy('title')))
  return snapshot.docs.map((categoryDoc) => {
    const data = categoryDoc.data()
    return {
      id: categoryDoc.id,
      accountId,
      title: typeof data.title === 'string' ? data.title : '',
      parentCategoryId:
        typeof data.parentCategoryId === 'string' && data.parentCategoryId
          ? data.parentCategoryId
          : null,
      type: normalizeType(data.type),
      sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
      fieldDefinitions: normalizeFieldDefinitions(data.fieldDefinitions),
    }
  }).filter((category) => category.title)
}

export async function createCategory(accountId: string, input: CategoryInput): Promise<Category> {
  const data = {
    title: input.title.trim(),
    parentCategoryId: input.parentCategoryId || null,
    type: input.type,
    sortOrder: input.sortOrder ?? 0,
    fieldDefinitions: normalizeFieldDefinitions(input.fieldDefinitions),
  }
  const created = await addDoc(categoriesRef(accountId), data)
  return { id: created.id, accountId, ...data }
}

export async function updateCategory(
  accountId: string,
  categoryId: string,
  input: CategoryInput
): Promise<void> {
  const data: UpdateData<DocumentData> = {
    title: input.title.trim(),
    parentCategoryId: input.parentCategoryId || null,
    type: input.type,
    fieldDefinitions: normalizeFieldDefinitions(input.fieldDefinitions),
  }
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder
  await updateDoc(doc(db, 'accounts', accountId, 'categories', categoryId), data)
}

export async function deleteCategory(accountId: string, categoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'accounts', accountId, 'categories', categoryId))
}

export async function updateCategoryTree(
  accountId: string,
  categories: Category[]
): Promise<void> {
  const batch = writeBatch(db)
  categories.forEach((category) => {
    batch.update(doc(db, 'accounts', accountId, 'categories', category.id), {
      parentCategoryId: category.parentCategoryId || null,
      sortOrder: category.sortOrder,
    })
  })
  await batch.commit()
}
