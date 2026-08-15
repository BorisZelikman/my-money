import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type {
  OperationType,
  Operation,
  Asset,
  MutualPurpose,
  LoanOperationOption,
  OperationTemplate,
  Category,
  CategoryInput,
  FuelDetails,
  OperationAdditionalField,
  CategoryFieldDefinition,
} from '@/types'
import { CategoryDialog } from '@/features/categories'
import { getCategoryFieldPreset } from '@/features/categories/fieldPresets'
import {
  additionalFieldsToFuelDetails,
  isFuelOperationText,
  resolveFuelDetails,
} from '@/features/operations/utils/fuelDetails'
import { getPurposeIcon } from '@/utils/icons'
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CircleMinus,
  CirclePlus,
  History,
  ListPlus,
  Plus,
  X,
} from 'lucide-react'
import styles from './OperationForm.module.css'

interface AssetOption {
  accountId: string
  accountTitle: string
  asset: Asset
}

interface OperationSettingsSource extends Operation {
  assetAccountId: string
  assetId: string
}

function formatDateForInput(date: Date) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function normalizeCommentItem(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().trim()
}

type AdditionalInputValue = string | boolean

function legacyFuelValue(
  field: CategoryFieldDefinition,
  details: FuelDetails
): AdditionalInputValue {
  if (field.id === 'fuel-unit-price') return details.unitPrice?.toString() || ''
  if (field.id === 'fuel-quantity') return details.liters?.toString() || ''
  if (field.id === 'fuel-odometer') return details.odometerKm?.toString() || ''
  if (field.id === 'fuel-full-tank') return details.fullTank === true
  return ''
}

export interface OperationFormData {
  type: OperationType | 'lend' | 'repay'
  title: string
  amount: number
  category: string
  categoryId?: string
  comment: string
  datetime: Date
  // Transfer fields
  targetAccountId?: string
  targetAssetId?: string
  rate?: number
  // Mutual fields
  purposeId?: string | null
  loanMutualId?: string
  fuelDetails?: FuelDetails | null
  additionalFields?: OperationAdditionalField[] | null
}

export interface OperationContextSummary {
  typeLabel: string
  assetLabel: string
  purposeLabel?: string
}

interface OperationFormProps {
  onSubmit: (data: OperationFormData) => Promise<void>
  onDelete?: () => void
  categories: string[]
  categoryDefinitions?: Category[]
  onCreateCategory?: (input: CategoryInput) => Promise<Category>
  editOperation?: Operation | null
  onCancelEdit?: () => void
  isSubmitting?: boolean
  // For transfers
  currentAsset?: AssetOption | null
  availableAssets?: AssetOption[]
  onAssetChange?: (index: number) => void
  // For mutuals
  purposes?: MutualPurpose[]
  loanMutuals?: LoanOperationOption[]
  operationTemplates?: OperationTemplate[]
  recentOperations?: OperationSettingsSource[]
  simpleMode?: boolean
  defaultAssetId?: string
  defaultOperationType?: Extract<OperationType, 'payment' | 'income'>
  defaultPurposeId?: string
  advancedContextVisible?: boolean
  onContextChange?: (context: OperationContextSummary) => void
  compact?: boolean
}

export function OperationForm({
  onSubmit,
  onDelete,
  categories,
  categoryDefinitions = [],
  onCreateCategory,
  editOperation,
  onCancelEdit,
  isSubmitting = false,
  currentAsset,
  availableAssets = [],
  onAssetChange,
  purposes = [],
  loanMutuals = [],
  operationTemplates = [],
  recentOperations = [],
  simpleMode = false,
  defaultAssetId,
  defaultOperationType,
  defaultPurposeId,
  advancedContextVisible = false,
  onContextChange,
  compact = false,
}: OperationFormProps) {
  const { t } = useTranslation()
  const [type, setType] = useState<OperationType | 'lend' | 'repay'>(
    defaultOperationType || 'payment'
  )
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [comment, setComment] = useState('')
  const [additionalFieldValues, setAdditionalFieldValues] = useState<
    Record<string, AdditionalInputValue>
  >({})
  const [purposeId, setPurposeId] = useState(defaultPurposeId || '')
  const [datetime, setDatetime] = useState(() => formatDateForInput(new Date()))
  const [showCategories, setShowCategories] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCommentSuggestions, setShowCommentSuggestions] = useState(false)
  const [selectedCommentItems, setSelectedCommentItems] = useState<Set<string>>(new Set())
  const [customCommentItems, setCustomCommentItems] = useState<string[]>([])
  const [newCommentItem, setNewCommentItem] = useState('')
  const [templatePopoverStyle, setTemplatePopoverStyle] = useState<CSSProperties>({})
  const categoryRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLDivElement>(null)
  const templatePopoverRef = useRef<HTMLDivElement>(null)
  const wasEditingRef = useRef(false)

  // Transfer state
  const [targetAssetIndex, setTargetAssetIndex] = useState<number>(-1)
  const [rate, setRate] = useState('1')
  const [loanMutualId, setLoanMutualId] = useState('')

  const resetForm = useCallback(() => {
    setType(defaultOperationType || 'payment')
    setTitle('')
    setAmount('')
    setCategory('')
    setCategoryId('')
    setComment('')
    setAdditionalFieldValues({})
    setDatetime(formatDateForInput(new Date()))
    setTargetAssetIndex(-1)
    setRate('1')
    setPurposeId(defaultPurposeId || '')
    setLoanMutualId('')
    setShowCommentSuggestions(false)
    setSelectedCommentItems(new Set())
    setCustomCommentItems([])
    setNewCommentItem('')
  }, [defaultOperationType, defaultPurposeId])

  const isEditMode = !!editOperation
  const isTransfer = type === 'transfer'
  const isLoan = type === 'lend' || type === 'repay'
  const selectedCategory = categoryDefinitions.find((item) =>
    item.id === categoryId || (
      !categoryId && item.title.toLocaleLowerCase() === category.trim().toLocaleLowerCase()
    )
  )
  const resolvedLegacyFuel = useMemo(() => {
    if (!editOperation || (!editOperation.fuelDetails && !isFuelOperationText(
      editOperation.title,
      editOperation.category || ''
    ))) return null
    return resolveFuelDetails(
      editOperation.fuelDetails,
      editOperation.comment || '',
      editOperation.amount,
      editOperation.additionalFields
    )
  }, [editOperation])
  const additionalFieldDefinitions = useMemo(() => {
    if (editOperation?.additionalFields?.length) {
      return editOperation.additionalFields.map((field): CategoryFieldDefinition => ({
        id: field.definitionId,
        label: field.label,
        type: field.type,
        unit: field.unit,
        required: false,
        role: field.role,
        aggregation: field.aggregation,
      }))
    }
    if (selectedCategory?.fieldDefinitions?.length) {
      return selectedCategory.fieldDefinitions
    }
    return resolvedLegacyFuel ? getCategoryFieldPreset('fuel') : []
  }, [editOperation?.additionalFields, resolvedLegacyFuel, selectedCategory])
  const showContextControls = !simpleMode || isEditMode || advancedContextVisible
  const loanOptionsForAsset = useMemo(
    () => currentAsset ? loanMutuals : [],
    [currentAsset, loanMutuals]
  )
  const selectedLoan = loanOptionsForAsset.find(
    (option) => option.mutualId === loanMutualId
  ) || loanOptionsForAsset[0] || null

  // Filter out current asset from transfer targets
  const transferTargets = availableAssets.filter(
    (opt) =>
      !(
        opt.accountId === currentAsset?.accountId &&
        opt.asset.id === currentAsset?.asset.id
      )
  )

  const selectedTarget = targetAssetIndex >= 0 ? transferTargets[targetAssetIndex] : null
  const currentAssetIndex = availableAssets.findIndex(
    (option) => option.accountId === currentAsset?.accountId &&
      option.asset.id === currentAsset?.asset.id
  )
  const selectedPurpose = purposes.find((purpose) => purpose.id === purposeId)
  const operationTypeLabel = type === 'payment'
    ? t('operations.payment')
    : type === 'income'
      ? t('common.income')
      : type === 'transfer'
        ? t('common.transfer')
        : type === 'lend'
          ? t('operations.lend')
          : t('operations.repay')

  useEffect(() => {
    onContextChange?.({
      typeLabel: operationTypeLabel,
      assetLabel: currentAsset?.asset.title || t('operations.noAssets'),
      purposeLabel: type === 'payment'
        ? selectedPurpose?.title || t('common.private')
        : undefined,
    })
  }, [currentAsset, onContextChange, operationTypeLabel, selectedPurpose, t, type])

  const rankedTemplates = useMemo(() => {
    const query = title.trim().toLocaleLowerCase()
    const groups = new Map<string, OperationTemplate[]>()

    operationTemplates
      .forEach((template) => {
        const key = template.canonicalKey.toLocaleLowerCase()
        groups.set(key, [...(groups.get(key) || []), template])
      })

    return Array.from(groups.values())
      .map((templates) => {
        const aliases = Array.from(new Set(templates.flatMap((template) => template.aliases)))
        const representative = [...templates].sort(
          (first, second) =>
            second.lastUsedAt.getTime() - first.lastUsedAt.getTime() ||
            (second.settingsVersion || 0) - (first.settingsVersion || 0)
        )[0]

        return {
          representative,
          aliases,
          useCount: templates.reduce((sum, template) => sum + template.useCount, 0),
          lastUsedAt: Math.max(...templates.map((template) => template.lastUsedAt.getTime())),
        }
      })
      .filter(({ aliases }) => !query || aliases.some(
        (alias) => alias.toLocaleLowerCase().includes(query)
      ))
      .sort((first, second) =>
        second.useCount - first.useCount || second.lastUsedAt - first.lastUsedAt
      )
      .map(({ representative }) => representative)
  }, [operationTemplates, title])

  const commentSuggestions = useMemo(() => {
    const normalizedTitle = title.normalize('NFKC').toLocaleLowerCase().trim()
    if (!normalizedTitle || (type !== 'payment' && type !== 'income')) return []

    const matchingCanonicalKeys = new Set(
      operationTemplates
        .filter((template) => template.type === type)
        .filter((template) => template.aliases.some(
          (alias) => alias.normalize('NFKC').toLocaleLowerCase().trim() === normalizedTitle
        ))
        .map((template) => template.canonicalKey)
    )
    const suggestions = new Map<string, {
      text: string
      count: number
      lastUsedAt: number
    }>()

    operationTemplates
      .filter((template) => template.type === type)
      .filter((template) => matchingCanonicalKeys.has(template.canonicalKey))
      .flatMap((template) => template.commentSuggestions || [])
      .forEach((suggestion) => {
        const key = suggestion.text.normalize('NFKC').toLocaleLowerCase().trim()
        const existing = suggestions.get(key)
        suggestions.set(key, {
          text: !existing || suggestion.lastUsedAt.getTime() > existing.lastUsedAt
            ? suggestion.text
            : existing.text,
          count: (existing?.count || 0) + suggestion.count,
          lastUsedAt: Math.max(existing?.lastUsedAt || 0, suggestion.lastUsedAt.getTime()),
        })
      })

    return Array.from(suggestions.values()).sort((first, second) =>
      second.count - first.count || second.lastUsedAt - first.lastUsedAt
    )
  }, [operationTemplates, title, type])

  const availableCommentItems = useMemo(() => [
    ...commentSuggestions.map((suggestion) => suggestion.text),
    ...customCommentItems.filter((customItem) => !commentSuggestions.some(
      (suggestion) => normalizeCommentItem(suggestion.text) === normalizeCommentItem(customItem)
    )),
  ], [commentSuggestions, customCommentItems])

  const applyTemplate = (template: OperationTemplate) => {
    const templateNames = new Set(
      [template.title, ...template.aliases].map(normalizeCommentItem)
    )
    const latestOperation = recentOperations
      .filter((operation) =>
        (operation.type === 'payment' || operation.type === 'income') &&
        templateNames.has(normalizeCommentItem(operation.title))
      )
      .sort((first, second) => second.datetime.toMillis() - first.datetime.toMillis())[0]
    const settings = latestOperation
      ? {
          type: latestOperation.type,
          title: latestOperation.title,
          accountId: latestOperation.assetAccountId,
          assetId: latestOperation.assetId,
          category: latestOperation.category || '',
          categoryId: latestOperation.categoryId,
          purposeId: latestOperation.purposeId,
        }
      : template
    const assetIndex = availableAssets.findIndex(
      (option) => option.accountId === settings.accountId &&
        option.asset.id === settings.assetId
    )
    if (assetIndex >= 0 && assetIndex !== currentAssetIndex) {
      onAssetChange?.(assetIndex)
    }
    setType(settings.type)
    setTitle(settings.title)
    setAmount('')
    setCategory(settings.category)
    setCategoryId(settings.categoryId || categoryDefinitions.find((item) =>
      item.title.toLocaleLowerCase() === settings.category.toLocaleLowerCase()
    )?.id || '')
    setPurposeId(settings.purposeId || '')
    setComment('')
    setAdditionalFieldValues({})
    setShowTemplates(false)
  }

  useEffect(() => {
    if (!showTemplates) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !titleInputRef.current?.contains(target) &&
        !templatePopoverRef.current?.contains(target)
      ) {
        setShowTemplates(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTemplates(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showTemplates])

  useLayoutEffect(() => {
    if (!showTemplates) return

    const updatePosition = () => {
      const rect = titleInputRef.current?.getBoundingClientRect()
      if (!rect) return

      const viewportPadding = 8
      const gap = 6
      const width = Math.min(430, window.innerWidth - viewportPadding * 2)
      const left = Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - width - viewportPadding)
      )
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding
      const spaceAbove = rect.top - gap - viewportPadding
      const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow
      const maxHeight = Math.max(120, Math.min(360, openAbove ? spaceAbove : spaceBelow))

      setTemplatePopoverStyle(openAbove
        ? {
            left,
            bottom: window.innerHeight - rect.top + gap,
            width,
            maxHeight,
          }
        : {
            top: rect.bottom + gap,
            left,
            width,
            maxHeight,
          })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showTemplates])

  useEffect(() => {
    if (!showCommentSuggestions) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowCommentSuggestions(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showCommentSuggestions])

  useEffect(() => {
    if (!showCommentSuggestions) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showCommentSuggestions])

  const openCommentSuggestions = () => {
    const suggestionByKey = new Map(
      commentSuggestions.map((suggestion) => [
        normalizeCommentItem(suggestion.text),
        suggestion.text,
      ])
    )
    const selected = new Set<string>()
    const customItems: string[] = []

    comment
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const savedItem = suggestionByKey.get(normalizeCommentItem(item))
        const selectedItem = savedItem || item
        selected.add(selectedItem)
        if (!savedItem && !customItems.some(
          (customItem) => normalizeCommentItem(customItem) === normalizeCommentItem(item)
        )) {
          customItems.push(item)
        }
      })

    setSelectedCommentItems(selected)
    setCustomCommentItems(customItems)
    setNewCommentItem('')
    setShowCommentSuggestions(true)
  }

  const toggleCommentItem = (text: string) => {
    setSelectedCommentItems((selected) => {
      const next = new Set(selected)
      if (next.has(text)) next.delete(text)
      else next.add(text)
      return next
    })
  }

  const applyCommentSuggestions = () => {
    const selected = availableCommentItems.filter(
      (item) => selectedCommentItems.has(item)
    )
    setComment(selected.join(', '))
    setShowCommentSuggestions(false)
  }

  const addCustomCommentItem = () => {
    const value = newCommentItem.trim()
    if (!value) return

    const existingItem = availableCommentItems.find(
      (item) => normalizeCommentItem(item) === normalizeCommentItem(value)
    )
    const item = existingItem || value
    if (!existingItem) {
      setCustomCommentItems((items) => [...items, value])
    }
    setSelectedCommentItems((items) => new Set(items).add(item))
    setNewCommentItem('')
  }

  // Auto-set rate when currencies differ
  useEffect(() => {
    if (isTransfer && selectedTarget && currentAsset) {
      if (currentAsset.asset.currency === selectedTarget.asset.currency) {
        setRate('1')
      }
      // Could fetch real exchange rate here
    }
  }, [isTransfer, selectedTarget, currentAsset])

  useEffect(() => {
    if (!selectedLoan) {
      setLoanMutualId('')
    } else if (!loanMutualId || !loanOptionsForAsset.some(
      (option) => option.mutualId === loanMutualId
    )) {
      setLoanMutualId(selectedLoan.mutualId)
    }
  }, [loanMutualId, loanOptionsForAsset, selectedLoan])

  useEffect(() => {
    if (!isEditMode) setAdditionalFieldValues({})
  }, [categoryId, isEditMode])

  // Populate form when editing
  useEffect(() => {
    if (editOperation) {
      wasEditingRef.current = true
      setType(editOperation.type)
      setTitle(editOperation.title)
      setAmount(String(editOperation.amount))
      setCategory(editOperation.category || '')
      setCategoryId(
        editOperation.categoryId || categoryDefinitions.find((item) =>
          item.title.toLocaleLowerCase() === (editOperation.category || '').toLocaleLowerCase()
        )?.id || ''
      )
      setComment(editOperation.comment || '')
      if (editOperation.additionalFields?.length) {
        setAdditionalFieldValues(Object.fromEntries(
          editOperation.additionalFields.map((field) => [
            field.definitionId,
            typeof field.value === 'boolean' ? field.value : String(field.value),
          ])
        ))
      } else if (resolvedLegacyFuel?.details) {
        setAdditionalFieldValues(Object.fromEntries(
          additionalFieldDefinitions.map((field) => [
            field.id,
            legacyFuelValue(field, resolvedLegacyFuel.details),
          ])
        ))
      } else {
        setAdditionalFieldValues({})
      }
      const date = editOperation.datetime.toDate()
      setDatetime(formatDateForInput(date))
      setRate(editOperation.rate !== undefined ? String(editOperation.rate) : '')
      setPurposeId(editOperation.purposeId || '')
      setLoanMutualId(editOperation.loanMutualId || '')
      const editTransferTargets = availableAssets.filter((option) => !(
        option.accountId === currentAsset?.accountId &&
        option.asset.id === currentAsset?.asset.id
      ))
      setTargetAssetIndex(editOperation.transferTo
        ? editTransferTargets.findIndex((option) =>
          option.asset.id === editOperation.transferTo?.assetId &&
          (!editOperation.transferTo.accountId ||
            option.accountId === editOperation.transferTo.accountId)
        )
        : -1)
      setShowTemplates(false)
      setShowCommentSuggestions(false)
      setSelectedCommentItems(new Set())
      setCustomCommentItems([])
      setNewCommentItem('')
    } else if (wasEditingRef.current) {
      wasEditingRef.current = false
      resetForm()
    }
  }, [
    additionalFieldDefinitions,
    availableAssets,
    categoryDefinitions,
    currentAsset,
    editOperation,
    resetForm,
    resolvedLegacyFuel,
  ])

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategories(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const additionalFieldsValid = additionalFieldDefinitions.every((field) => {
    if (!field.required || field.type === 'boolean') return true
    const value = additionalFieldValues[field.id]
    return typeof value === 'string' && value.trim() !== ''
  })
  const isValid = (() => {
    const baseValid = parseFloat(amount) > 0 && datetime
    if (isLoan) return baseValid && !!selectedLoan
    if (isTransfer) {
      return baseValid && title.trim() && targetAssetIndex >= 0 && parseFloat(rate) > 0
    }
    return baseValid && !!title.trim() && additionalFieldsValid
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    const parsedAmount = parseFloat(amount)
    const additionalFields = additionalFieldDefinitions.flatMap(
      (field): OperationAdditionalField[] => {
        const inputValue = additionalFieldValues[field.id]
        if (field.type !== 'boolean' && (
          typeof inputValue !== 'string' || !inputValue.trim()
        )) return []
        const value = field.type === 'number'
          ? Number(inputValue)
          : field.type === 'boolean'
            ? inputValue === true
            : String(inputValue)
        if (field.type === 'number' && !Number.isFinite(value)) return []
        return [{
          definitionId: field.id,
          label: field.label,
          type: field.type,
          unit: field.unit,
          role: field.role,
          aggregation: field.aggregation,
          value,
        }]
      }
    )
    const compatibleFuelDetails = additionalFieldsToFuelDetails(additionalFields)

    const data: OperationFormData = {
      type,
      title: isLoan && selectedLoan
        ? type === 'lend'
          ? `Loan to ${selectedLoan.borrowerTitle}`
          : `Repayment from ${selectedLoan.borrowerTitle}`
        : title.trim(),
      amount: parsedAmount,
      category: isLoan
        ? type === 'lend' ? 'Loan advance' : 'Loan repayment'
        : isTransfer ? 'Transfer' : category.trim(),
      categoryId: !isLoan && !isTransfer && categoryId ? categoryId : undefined,
      comment: comment.trim(),
      datetime: new Date(datetime),
      additionalFields: additionalFields.length > 0
        ? additionalFields
        : isEditMode ? null : undefined,
      fuelDetails: compatibleFuelDetails || (isEditMode ? null : undefined),
    }

    if (isTransfer && selectedTarget) {
      data.targetAccountId = selectedTarget.accountId
      data.targetAssetId = selectedTarget.asset.id
      data.rate = parseFloat(rate)
    }
    if (isLoan && selectedLoan) {
      data.loanMutualId = selectedLoan.mutualId
    }

    // An explicit null lets updates remove a previously selected shared purpose.
    data.purposeId = type === 'payment' && purposes.some(
      (purpose) => purpose.id === purposeId
    )
      ? purposeId
      : null

    await onSubmit(data)

    if (!isEditMode) {
      resetForm()
      if (defaultAssetId && onAssetChange) {
        const defaultAssetIndex = availableAssets.findIndex(
          (option) => option.asset.id === defaultAssetId
        )
        if (defaultAssetIndex >= 0) onAssetChange(defaultAssetIndex)
      }
    }
  }

  const filteredCategories = useMemo(() => {
    const byId = new Map(categoryDefinitions.map((item) => [item.id, item]))
    const getLabel = (item: Category) => {
      const parts = [item.title]
      const visited = new Set([item.id])
      let parent = item.parentCategoryId ? byId.get(item.parentCategoryId) : undefined
      while (parent && !visited.has(parent.id)) {
        visited.add(parent.id)
        parts.unshift(parent.title)
        parent = parent.parentCategoryId ? byId.get(parent.parentCategoryId) : undefined
      }
      return parts.join(' / ')
    }
    const allowedType = type === 'income' ? 'income' : 'expense'
    const storedOptions = categoryDefinitions
      .filter((item) => item.type === 'both' || item.type === allowedType)
      .map((item) => ({ id: item.id, title: item.title, label: getLabel(item) }))
    const storedTitles = new Set(
      categoryDefinitions.map((item) => item.title.toLocaleLowerCase())
    )
    const legacyOptions = categories
      .filter((title) => !storedTitles.has(title.toLocaleLowerCase()))
      .map((title) => ({ id: '', title, label: title }))
    const query = category.toLocaleLowerCase()
    return [...storedOptions, ...legacyOptions]
      .filter((option) => option.label.toLocaleLowerCase().includes(query))
      .sort((first, second) => first.label.localeCompare(second.label))
  }, [categories, category, categoryDefinitions, type])
  const canCreateCategory = !!onCreateCategory && !!category.trim() &&
    !isLoan && !isTransfer && !categoryDefinitions.some((item) =>
      item.title.trim().toLocaleLowerCase() === category.trim().toLocaleLowerCase()
    )

  const handleCreateCategory = async (input: CategoryInput) => {
    if (!onCreateCategory) return
    const created = await onCreateCategory(input)
    setCategory(created.title)
    setCategoryId(created.id)
    setShowCategories(false)
    setShowCreateCategory(false)
  }

  const targetAmount =
    isTransfer && selectedTarget
      ? (parseFloat(amount) || 0) * (parseFloat(rate) || 1)
      : 0

  const submitLabel = isSubmitting
    ? t('common.saving')
    : isEditMode
    ? t('operations.updateOperation')
    : type === 'payment'
    ? t('operations.addPayment')
    : type === 'income'
    ? t('operations.addIncome')
    : type === 'lend'
    ? t('operations.addLend')
    : type === 'repay'
    ? t('operations.addRepay')
    : t('operations.addTransfer')

  return (
    <>
    <form
      className={`${styles.form} ${compact ? styles.compactForm : ''}`}
      onSubmit={handleSubmit}
    >
      {showContextControls && (compact || simpleMode) && availableAssets.length > 1 && onAssetChange && (
        <div className={styles.compactAssetSelector}>
          <label htmlFor="operation-asset-select">{t('common.asset')}</label>
          <select
            id="operation-asset-select"
            value={currentAssetIndex}
            onChange={(event) => onAssetChange(Number(event.target.value))}
          >
            {availableAssets.map((option, index) => (
              <option key={`${option.accountId}-${option.asset.id}`} value={index}>
                {option.accountTitle} → {option.asset.title} ({option.asset.currency})
              </option>
            ))}
          </select>
        </div>
      )}

      {showContextControls && <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'payment' ? styles.activePayment : ''}`}
          onClick={() => setType('payment')}
          disabled={isEditMode && editOperation?.type === 'transfer'}
        >
          <CircleMinus className={styles.typeIcon} aria-hidden="true" />
          <span>{t('operations.payment')}</span>
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
          onClick={() => setType('income')}
          disabled={isEditMode && editOperation?.type === 'transfer'}
        >
          <CirclePlus className={styles.typeIcon} aria-hidden="true" />
          <span>{t('common.income')}</span>
        </button>
        {(!compact || transferTargets.length > 0) && (
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'transfer' ? styles.activeTransfer : ''}`}
            onClick={() => setType('transfer')}
            disabled={isEditMode || transferTargets.length === 0}
            title={transferTargets.length === 0 ? 'No other assets to transfer to' : ''}
          >
            <ArrowRightLeft className={styles.typeIcon} aria-hidden="true" />
            <span>{t('common.transfer')}</span>
          </button>
        )}
        {loanMutuals.length > 0 && (
          <>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'lend' ? styles.activeLend : ''}`}
              onClick={() => setType('lend')}
              disabled={isEditMode || loanOptionsForAsset.length === 0}
            >
              <ArrowUpRight className={styles.typeIcon} aria-hidden="true" />
              <span>{t('operations.lend')}</span>
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'repay' ? styles.activeRepay : ''}`}
              onClick={() => setType('repay')}
              disabled={isEditMode || loanOptionsForAsset.length === 0}
            >
              <ArrowDownLeft className={styles.typeIcon} aria-hidden="true" />
              <span>{t('operations.repay')}</span>
            </button>
          </>
        )}
      </div>}

      {isLoan ? (
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="loanMutual">{t('operations.loanRelationship')} *</label>
            <select
              id="loanMutual"
              value={selectedLoan?.mutualId || ''}
              onChange={(event) => setLoanMutualId(event.target.value)}
              required
            >
              {loanOptionsForAsset.map((option) => (
                <option key={option.mutualId} value={option.mutualId}>
                  {option.mutualTitle} · {option.borrowerTitle}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="amount">{t('common.amount')} *</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>
        </div>
      ) : (
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="title">{t('common.title')} *</label>
            <div className={styles.titleInput} ref={titleInputRef}>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isTransfer ? t('operations.transferPlaceholder') : t('operations.titlePlaceholder')}
                required
              />
              {!isEditMode && !isTransfer && operationTemplates.length > 0 && (
                <button
                  type="button"
                  className={styles.templateButton}
                  onClick={() => {
                    setShowTemplates((visible) => !visible)
                    requestAnimationFrame(() => {
                      titleInputRef.current?.querySelector('input')?.focus()
                    })
                  }}
                  aria-label={t('operations.chooseHistory')}
                  aria-expanded={showTemplates}
                  title={t('operations.chooseHistory')}
                >
                  <History aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="amount">{t('common.amount')} *</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>
        </div>
      )}

      {isTransfer ? (
        <>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="targetAsset">{t('operations.targetAsset')} *</label>
              <select
                id="targetAsset"
                value={targetAssetIndex}
                onChange={(e) => setTargetAssetIndex(parseInt(e.target.value, 10))}
                required
              >
                <option value={-1}>{t('operations.selectDestination')}</option>
                {transferTargets.map((option, index) => (
                  <option key={`${option.accountId}-${option.asset.id}`} value={index}>
                    {option.accountTitle} → {option.asset.title} ({option.asset.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="rate">{t('operations.exchangeRate')}</label>
              <input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="1.00"
                min="0.0001"
                step="0.0001"
              />
            </div>
          </div>

          {selectedTarget && parseFloat(amount) > 0 && (
            <div className={styles.transferPreview}>
              <span className={styles.previewLabel}>{t('operations.recipientGets')}</span>
              <span className={styles.previewAmount}>
                {targetAmount.toFixed(2)} {selectedTarget.asset.currency}
              </span>
              {currentAsset && currentAsset.asset.currency !== selectedTarget.asset.currency && (
                <span className={styles.previewRate}>
                  (1 {currentAsset.asset.currency} = {rate} {selectedTarget.asset.currency})
                </span>
              )}
            </div>
          )}
        </>
      ) : isLoan ? (
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="datetime">{t('operations.dateTime')} *</label>
            <input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <div className={styles.row}>
          <div className={styles.field} ref={categoryRef}>
            <label htmlFor="category">{t('common.category')}</label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => {
                const nextCategory = e.target.value
                setCategory(nextCategory)
                const matchingCategory = categoryDefinitions.find((item) =>
                  item.title.toLocaleLowerCase() === nextCategory.trim().toLocaleLowerCase()
                )
                setCategoryId(matchingCategory?.id || '')
              }}
              onFocus={() => setShowCategories(true)}
              placeholder={t('operations.categoryPlaceholder')}
              autoComplete="off"
            />
            {showCategories && (filteredCategories.length > 0 || canCreateCategory) && (
              <div className={styles.dropdown}>
                {canCreateCategory && (
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${styles.createCategoryItem}`}
                    onClick={() => setShowCreateCategory(true)}
                  >
                    <Plus aria-hidden="true" />
                    <span>Create “{category.trim()}”</span>
                  </button>
                )}
                {filteredCategories.map((option) => (
                  <button
                    key={option.id || option.title}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setCategory(option.title)
                      setCategoryId(option.id)
                      setShowCategories(false)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="datetime">{t('operations.dateTime')} *</label>
            <input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {isTransfer && (
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="datetime">{t('operations.dateTime')} *</label>
            <input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {additionalFieldDefinitions.length > 0 && (
        <fieldset className={styles.additionalDetails}>
          <legend>{t('operations.additionalDetails')}</legend>
          <div className={styles.additionalDetailsGrid}>
            {additionalFieldDefinitions.map((field) => {
              const inputId = `additional-${field.id}`
              const value = additionalFieldValues[field.id] ?? (
                field.type === 'boolean' ? false : ''
              )
              if (field.type === 'boolean') {
                return (
                  <label className={styles.booleanDetailField} key={field.id}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={value === true}
                      onChange={(event) => setAdditionalFieldValues((values) => ({
                        ...values,
                        [field.id]: event.target.checked,
                      }))}
                    />
                    <span>{field.label}{field.required ? ' *' : ''}</span>
                  </label>
                )
              }
              return (
                <label key={field.id} htmlFor={inputId}>
                  <span>
                    {field.label}{field.unit ? `, ${field.unit}` : ''}
                    {field.required ? ' *' : ''}
                  </span>
                  <input
                    id={inputId}
                    type={field.type === 'number' ? 'number' : field.type}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => setAdditionalFieldValues((values) => ({
                      ...values,
                      [field.id]: event.target.value,
                    }))}
                    step={field.type === 'number' ? 'any' : undefined}
                    inputMode={field.type === 'number' ? 'decimal' : undefined}
                    required={field.required}
                  />
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {isLoan && selectedLoan && (
        <div className={styles.loanPreview}>
          <strong>
            {type === 'lend'
              ? `${selectedLoan.lenderTitle} lends ${selectedLoan.borrowerTitle}`
              : `${selectedLoan.borrowerTitle} repays ${selectedLoan.lenderTitle}`}
          </strong>
          <span>
            {(parseFloat(amount) || 0).toFixed(2)} {currentAsset?.asset.currency || 'ILS'}
          </span>
          <small>
            {selectedLoan.borrowerAccountId
              ? 'Both linked assets and the debt will be updated.'
              : 'Your asset and the debt will be updated; the borrower is external.'}
          </small>
        </div>
      )}

      {/* Purpose selector for mutual expenses */}
      {showContextControls && type === 'payment' && purposes.length > 0 && (
        <div className={styles.field}>
          <label htmlFor="purpose">{t('operations.purpose')}</label>
          <select
            id="purpose"
            value={purposeId}
            onChange={(e) => setPurposeId(e.target.value)}
            className={styles.purposeSelect}
          >
            <option value="">{t('common.private')}</option>
            {purposes.filter(p => !p.isSettlement).map((purpose) => (
              <option key={purpose.id} value={purpose.id}>
                {getPurposeIcon(purpose.icon)} {purpose.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={`${styles.field} ${styles.commentField}`}>
        <label htmlFor="comment">{t('common.comment')}</label>
        <div className={styles.commentInput}>
          <input
            id="comment"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('operations.commentPlaceholder')}
          />
          <button
            type="button"
            className={styles.commentItemsButton}
            onClick={openCommentSuggestions}
            aria-label={t('operations.commentItems')}
            aria-expanded={showCommentSuggestions}
            title={t('operations.commentItems')}
          >
            <ListPlus aria-hidden="true" />
          </button>
        </div>
      </div>

      {showTemplates && createPortal(
        <div
          ref={templatePopoverRef}
          className={styles.templatePopover}
          style={templatePopoverStyle}
          role="listbox"
          aria-label={t('operations.previousOperations')}
        >
          {rankedTemplates.length > 0 ? rankedTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.templateItem}
              onClick={() => applyTemplate(template)}
              role="option"
              title={template.title}
            >
              <span className={styles.templateIcon} aria-hidden="true">{template.icon}</span>
              <span className={styles.templateTitle}>{template.title}</span>
            </button>
          )) : (
            <div className={styles.templateEmpty}>{t('operations.noMatching')}</div>
          )}
        </div>,
        document.body
      )}

      {showCommentSuggestions && createPortal(
        <div
          className={styles.selectionOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCommentSuggestions(false)
          }}
        >
          <section
            className={styles.selectionPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-suggestions-title"
          >
            <header className={styles.selectionHeader}>
              <h3 id="comment-suggestions-title">{t('operations.commentItems')}</h3>
              <button
                type="button"
                className={styles.selectionClose}
                onClick={() => setShowCommentSuggestions(false)}
                aria-label={t('common.close')}
                title={t('common.close')}
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className={styles.commentSuggestions}>
              <div className={styles.newCommentItemRow}>
                <input
                  type="text"
                  value={newCommentItem}
                  onChange={(event) => setNewCommentItem(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomCommentItem()
                    }
                  }}
                  placeholder={t('operations.addCommentItem')}
                  aria-label={t('operations.addCommentItem')}
                />
                <button
                  type="button"
                  onClick={addCustomCommentItem}
                  disabled={!newCommentItem.trim()}
                  aria-label={t('common.add')}
                  title={t('common.add')}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <div className={styles.commentSuggestionList}>
                {availableCommentItems.length > 0 ? availableCommentItems.map((item) => (
                  <label key={item} className={styles.commentSuggestionItem}>
                    <input
                      type="checkbox"
                      checked={selectedCommentItems.has(item)}
                      onChange={() => toggleCommentItem(item)}
                    />
                    <span title={item}>{item}</span>
                  </label>
                )) : (
                  <div className={styles.commentSuggestionEmpty}>{t('operations.noCommentItems')}</div>
                )}
              </div>
              <div className={styles.commentSuggestionActions}>
                <button type="button" onClick={() => setShowCommentSuggestions(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.commentSuggestionApply}
                  onClick={applyCommentSuggestions}
                  disabled={selectedCommentItems.size === 0}
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </section>
        </div>,
        document.body
      )}

      <div className={styles.actions}>
        {isEditMode && (
          <>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Delete
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </>
        )}
        <button
          type="submit"
          className={`${styles.submitBtn} ${
            type === 'payment'
              ? styles.paymentBtn
              : type === 'income'
              ? styles.incomeBtn
              : type === 'lend'
              ? styles.paymentBtn
              : type === 'repay'
              ? styles.incomeBtn
              : styles.transferBtn
          }`}
          disabled={!isValid || isSubmitting}
          aria-label={submitLabel}
        >
          {submitLabel}
        </button>
      </div>
    </form>
    <CategoryDialog
      isOpen={showCreateCategory}
      categories={categoryDefinitions}
      initialTitle={category.trim()}
      initialType={type === 'income' ? 'income' : 'expense'}
      onSave={handleCreateCategory}
      onCancel={() => setShowCreateCategory(false)}
    />
    </>
  )
}
