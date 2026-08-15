import { useEffect, useMemo, useState } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import { Droplets, Fuel, Plus, Trash2, Zap } from 'lucide-react'
import type {
  Category,
  CategoryFieldAggregation,
  CategoryFieldDefinition,
  CategoryFieldRole,
  CategoryFieldType,
  CategoryInput,
  CategoryType,
} from '@/types'
import {
  createCategoryFieldDefinition,
  getCategoryFieldPreset,
  type CategoryFieldPreset,
} from '../fieldPresets'
import styles from './CategoryDialog.module.css'

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
  const [fieldDefinitions, setFieldDefinitions] = useState<CategoryFieldDefinition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setTitle(category?.title || initialTitle)
    setParentCategoryId(category?.parentCategoryId || '')
    setType(category?.type || initialType)
    setFieldDefinitions((category?.fieldDefinitions || []).map((field) => ({ ...field })))
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
    if (fieldDefinitions.some((field) => !field.label.trim())) {
      setError('Every additional field needs a label')
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        title: title.trim(),
        parentCategoryId: parentCategoryId || null,
        type,
        fieldDefinitions: fieldDefinitions.map((field) => ({
          ...field,
          label: field.label.trim(),
          unit: field.unit?.trim() || undefined,
        })),
      })
    } catch {
      setError('Failed to save category')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (
    id: string,
    changes: Partial<CategoryFieldDefinition>
  ) => {
    setFieldDefinitions((fields) => fields.map((field) =>
      field.id === id ? { ...field, ...changes } : field
    ))
  }

  const updateFieldType = (id: string, fieldType: CategoryFieldType) => {
    if (fieldType === 'number') {
      updateField(id, { type: fieldType })
      return
    }
    updateField(id, {
      type: fieldType,
      unit: undefined,
      role: fieldType === 'boolean' ? 'flag' : 'note',
      aggregation: 'last',
    })
  }

  const applyPreset = (preset: CategoryFieldPreset) => {
    const presetFields = getCategoryFieldPreset(preset)
    setFieldDefinitions((fields) => {
      const existingIds = new Set(fields.map((field) => field.id))
      return [...fields, ...presetFields.filter((field) => !existingIds.has(field.id))]
    })
  }

  return (
    <FormDialog
      isOpen={isOpen}
      title={category ? 'Edit Category' : 'Add Category'}
      submitLabel={category ? 'Update' : 'Create'}
      isLoading={isLoading}
      wide
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


      <section className={styles.additionalFields}>
        <div className={styles.additionalFieldsHeading}>
          <div>
            <h3>Additional fields</h3>
            <p>Measurements saved with operations in this category.</p>
          </div>
          <button
            type="button"
            className={styles.addFieldButton}
            onClick={() => setFieldDefinitions((fields) => [
              ...fields,
              createCategoryFieldDefinition(),
            ])}
          >
            <Plus aria-hidden="true" />
            Add field
          </button>
        </div>

        <div className={styles.presets} aria-label="Additional field presets">
          <button type="button" onClick={() => applyPreset('fuel')}>
            <Fuel aria-hidden="true" />Fuel
          </button>
          <button type="button" onClick={() => applyPreset('electricity')}>
            <Zap aria-hidden="true" />Electricity meter
          </button>
          <button type="button" onClick={() => applyPreset('water')}>
            <Droplets aria-hidden="true" />Water meter
          </button>
        </div>

        {fieldDefinitions.length === 0 ? (
          <p className={styles.noFields}>No additional fields.</p>
        ) : (
          <div className={styles.fieldList}>
            {fieldDefinitions.map((field) => (
              <div className={styles.fieldDefinition} key={field.id}>
                <input
                  aria-label="Field label"
                  value={field.label}
                  placeholder="Field label"
                  onChange={(event) => updateField(field.id, { label: event.target.value })}
                />
                <select
                  aria-label={`${field.label || 'Field'} value type`}
                  value={field.type}
                  onChange={(event) => updateFieldType(
                    field.id,
                    event.target.value as CategoryFieldType
                  )}
                >
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                  <option value="boolean">Yes / no</option>
                  <option value="date">Date</option>
                </select>
                <input
                  aria-label={`${field.label || 'Field'} unit`}
                  value={field.unit || ''}
                  placeholder="Unit"
                  disabled={field.type === 'boolean' || field.type === 'date'}
                  onChange={(event) => updateField(field.id, { unit: event.target.value })}
                />
                <select
                  aria-label={`${field.label || 'Field'} meaning`}
                  value={field.role}
                  disabled={field.type !== 'number'}
                  onChange={(event) => updateField(field.id, {
                    role: event.target.value as CategoryFieldRole,
                  })}
                >
                  <option value="quantity">Quantity</option>
                  <option value="unitPrice">Unit price</option>
                  <option value="cumulativeReading">Counter reading</option>
                  <option value="flag">Flag</option>
                  <option value="note">Note</option>
                </select>
                <select
                  aria-label={`${field.label || 'Field'} statistics`}
                  value={field.aggregation}
                  disabled={field.type !== 'number'}
                  onChange={(event) => updateField(field.id, {
                    aggregation: event.target.value as CategoryFieldAggregation,
                  })}
                >
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                  <option value="last">Latest</option>
                  <option value="delta">Difference</option>
                </select>
                <label className={styles.requiredField}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => updateField(field.id, {
                      required: event.target.checked,
                    })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  className={styles.removeFieldButton}
                  onClick={() => setFieldDefinitions((fields) =>
                    fields.filter((item) => item.id !== field.id)
                  )}
                  aria-label={`Remove ${field.label || 'field'}`}
                  title="Remove field"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </FormDialog>
  )
}
