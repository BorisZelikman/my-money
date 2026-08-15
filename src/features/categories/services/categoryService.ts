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
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Category, CategoryInput, CategoryType } from '@/types'

function categoriesRef(accountId: string) {
  return collection(db, 'accounts', accountId, 'categories')
}

function normalizeType(value: unknown): CategoryType {
  return value === 'expense' || value === 'income' ? value : 'both'
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
    }
  }).filter((category) => category.title)
}

export async function createCategory(accountId: string, input: CategoryInput): Promise<Category> {
  const data = {
    title: input.title.trim(),
    parentCategoryId: input.parentCategoryId || null,
    type: input.type,
    sortOrder: input.sortOrder ?? 0,
  }
  const created = await addDoc(categoriesRef(accountId), data)
  return { id: created.id, accountId, ...data }
}

export async function updateCategory(
  accountId: string,
  categoryId: string,
  input: CategoryInput
): Promise<void> {
  const data: Record<string, string | number | null> = {
    title: input.title.trim(),
    parentCategoryId: input.parentCategoryId || null,
    type: input.type,
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
