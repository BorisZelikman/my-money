import { useEffect, useMemo, useState } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import type { Category, CategoryInput, CategoryType } from '@/types'

interface CategoryDialogProps {
  isOpen: boolean
  category?: Category | null
  categories: Category[]
  initialTitle?: string
  initialType?: CategoryType
  onSave: (data: CategoryInput) => Promise<void>
  onCancel: () => void
}

function descendantIds(categoryId: string, categories: Category[]) {
  const descendants = new Set<string>()
  const visit = (parentId: string) => {
    categories.filter((item) => item.parentCategoryId === parentId).forEach((item) => {
      if (descendants.has(item.id)) return
      descendants.add(item.id)
      visit(item.id)
    })
  }
  visit(categoryId)
  return descendants
}

export function CategoryDialog({
  isOpen,
  category,
  categories,
  initialTitle = '',
  initialType = 'expense',
  onSave,
  onCancel,
}: CategoryDialogProps) {
  const [title, setTitle] = useState('')
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [type, setType] = useState<CategoryType>('expense')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setTitle(category?.title || initialTitle)
    setParentCategoryId(category?.parentCategoryId || '')
    setType(category?.type || initialType)
    setError('')
  }, [category, initialTitle, initialType, isOpen])

  const blockedParentIds = useMemo(() => {
    if (!category) return new Set<string>()
    return new Set([category.id, ...descendantIds(category.id, categories)])
  }, [categories, category])

  const availableParents = useMemo(() => {
    const byId = new Map(categories.map((item) => [item.id, item]))
    const getPath = (item: Category) => {
      const path = [item.title]
      const visited = new Set([item.id])
      let parent = item.parentCategoryId ? byId.get(item.parentCategoryId) : undefined
      while (parent && !visited.has(parent.id)) {
        visited.add(parent.id)
        path.unshift(parent.title)
        parent = parent.parentCategoryId ? byId.get(parent.parentCategoryId) : undefined
      }
      return path.join(' / ')
    }
    return categories
      .filter((item) => !blockedParentIds.has(item.id))
      .map((item) => ({ item, label: getPath(item) }))
      .sort((first, second) => first.label.localeCompare(second.label))
  }, [blockedParentIds, categories])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Category name is required')
      return
    }
    if (categories.some((item) =>
      item.id !== category?.id && item.title.trim().toLocaleLowerCase() === title.trim().toLocaleLowerCase()
    )) {
      setError('A category with this name already exists')
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        title: title.trim(),
        parentCategoryId: parentCategoryId || null,
        type,
      })
    } catch {
      setError('Failed to save category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      title={category ? 'Edit Category' : 'Add Category'}
      submitLabel={category ? 'Update' : 'Create'}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <FormField label="Category Name" required error={error}>
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setError('')
          }}
          placeholder="e.g. Car, Fuel, Taxes"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Parent Category">
        <select
          value={parentCategoryId}
          onChange={(event) => setParentCategoryId(event.target.value)}
          disabled={isLoading}
        >
          <option value="">None (top level)</option>
          {availableParents.map(({ item, label }) => (
            <option key={item.id} value={item.id}>{label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Used For">
        <select
          value={type}
          onChange={(event) => setType(event.target.value as CategoryType)}
          disabled={isLoading}
        >
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
          <option value="both">Income and expenses</option>
        </select>
      </FormField>
    </FormDialog>
  )
}
