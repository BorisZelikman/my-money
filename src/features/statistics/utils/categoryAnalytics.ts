import type { Category } from '@/types'
import type { LocatedOperation } from '../types'

export interface CategoryAnalyticsNode {
  key: string
  title: string
  income: number
  expenses: number
  net: number
  activity: number
  count: number
  operations: LocatedOperation[]
  directOperations: LocatedOperation[]
  children: CategoryAnalyticsNode[]
}

interface MutableCategoryNode extends Omit<CategoryAnalyticsNode, 'children'> {
  childrenMap: Map<string, MutableCategoryNode>
}

function normalize(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase()
}

function findOperationCategory(operation: LocatedOperation, categories: Category[]) {
  const accountCategories = categories.filter((category) =>
    category.accountId === operation.accountId
  )
  return operation.categoryId
    ? accountCategories.find((category) => category.id === operation.categoryId)
    : accountCategories.find((category) =>
      normalize(category.title) === normalize(operation.category || '')
    )
}

export function getOperationCategoryPath(
  operation: LocatedOperation,
  categories: Category[]
) {
  const accountCategories = categories.filter((category) =>
    category.accountId === operation.accountId
  )
  const byId = new Map(accountCategories.map((category) => [category.id, category]))
  const leaf = findOperationCategory(operation, categories)
  if (!leaf) return [operation.category?.trim() || 'Uncategorized']

  const path = [leaf.title]
  const visited = new Set([leaf.id])
  let parent = leaf.parentCategoryId ? byId.get(leaf.parentCategoryId) : undefined
  while (parent && !visited.has(parent.id)) {
    path.unshift(parent.title)
    visited.add(parent.id)
    parent = parent.parentCategoryId ? byId.get(parent.parentCategoryId) : undefined
  }
  return path
}

function freezeNode(node: MutableCategoryNode): CategoryAnalyticsNode {
  return {
    key: node.key,
    title: node.title,
    income: node.income,
    expenses: node.expenses,
    net: node.income - node.expenses,
    activity: node.income + node.expenses,
    count: node.count,
    operations: node.operations,
    directOperations: node.directOperations,
    children: [...node.childrenMap.values()]
      .sort((first, second) =>
        (second.income + second.expenses) - (first.income + first.expenses) ||
        first.title.localeCompare(second.title)
      )
      .map(freezeNode),
  }
}

export function buildCategoryTree(
  operations: LocatedOperation[],
  categories: Category[]
) {
  const root: MutableCategoryNode = {
    key: 'all',
    title: 'All categories',
    income: 0,
    expenses: 0,
    net: 0,
    activity: 0,
    count: 0,
    operations: [],
    directOperations: [],
    childrenMap: new Map(),
  }

  operations.forEach((operation) => {
    if (
      (operation.type !== 'payment' && operation.type !== 'income') ||
      operation.settlementId ||
      operation.loanEntryId
    ) return

    const amount = Number(operation.amount) || 0
    const amountKey = operation.type === 'income' ? 'income' : 'expenses'
    root[amountKey] += amount
    root.count += 1
    root.operations.push(operation)
    let current = root
    getOperationCategoryPath(operation, categories).forEach((title) => {
      const key = normalize(title) || 'uncategorized'
      let child = current.childrenMap.get(key)
      if (!child) {
        child = {
          key,
          title: title.trim() || 'Uncategorized',
          income: 0,
          expenses: 0,
          net: 0,
          activity: 0,
          count: 0,
          operations: [],
          directOperations: [],
          childrenMap: new Map(),
        }
        current.childrenMap.set(key, child)
      }
      child[amountKey] += amount
      child.count += 1
      child.operations.push(operation)
      current = child
    })
    current.directOperations.push(operation)
  })

  return freezeNode(root)
}

export function findCategoryNode(root: CategoryAnalyticsNode, path: string[]) {
  let current = root
  for (const key of path) {
    const child = current.children.find((candidate) => candidate.key === key)
    if (!child) return null
    current = child
  }
  return current
}
