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
import type {
  OperationType,
  Operation,
  Asset,
  MutualPurpose,
  LoanOperationOption,
  OperationTemplate,
} from '@/types'
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

function formatDateForInput(date: Date) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function normalizeCommentItem(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().trim()
}

export interface OperationFormData {
  type: OperationType | 'lend' | 'repay'
  title: string
  amount: number
  category: string
  comment: string
  datetime: Date
  // Transfer fields
  targetAccountId?: string
  targetAssetId?: string
  rate?: number
  // Mutual fields
  purposeId?: string
  loanMutualId?: string
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
  editOperation,
  onCancelEdit,
  isSubmitting = false,
  currentAsset,
  availableAssets = [],
  onAssetChange,
  purposes = [],
  loanMutuals = [],
  operationTemplates = [],
  simpleMode = false,
  defaultAssetId,
  defaultOperationType,
  defaultPurposeId,
  advancedContextVisible = false,
  onContextChange,
  compact = false,
}: OperationFormProps) {
  const [type, setType] = useState<OperationType | 'lend' | 'repay'>(
    defaultOperationType || 'payment'
  )
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [comment, setComment] = useState('')
  const [purposeId, setPurposeId] = useState(defaultPurposeId || '')
  const [datetime, setDatetime] = useState(() => formatDateForInput(new Date()))
  const [showCategories, setShowCategories] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCommentSuggestions, setShowCommentSuggestions] = useState(false)
  const [selectedCommentItems, setSelectedCommentItems] = useState<Set<string>>(new Set())
  const [customCommentItems, setCustomCommentItems] = useState<string[]>([])
  const [newCommentItem, setNewCommentItem] = useState('')
  const [templatePopoverStyle, setTemplatePopoverStyle] = useState<CSSProperties>({})
  const categoryRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLDivElement>(null)
  const templatePopoverRef = useRef<HTMLDivElement>(null)

  // Transfer state
  const [targetAssetIndex, setTargetAssetIndex] = useState<number>(-1)
  const [rate, setRate] = useState('1')
  const [loanMutualId, setLoanMutualId] = useState('')

  const resetForm = useCallback(() => {
    setType(defaultOperationType || 'payment')
    setTitle('')
    setAmount('')
    setCategory('')
    setComment('')
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
    ? 'Payment'
    : type === 'income'
      ? 'Income'
      : type === 'transfer'
        ? 'Transfer'
        : type === 'lend'
          ? 'Lend'
          : 'Repay'

  useEffect(() => {
    onContextChange?.({
      typeLabel: operationTypeLabel,
      assetLabel: currentAsset?.asset.title || 'No asset',
      purposeLabel: type === 'payment'
        ? selectedPurpose?.title || 'Private'
        : undefined,
    })
  }, [currentAsset, onContextChange, operationTypeLabel, selectedPurpose, type])

  const rankedTemplates = useMemo(() => {
    const query = title.trim().toLocaleLowerCase()
    const groups = new Map<string, OperationTemplate[]>()

    operationTemplates
      .filter((template) => template.type === type)
      .forEach((template) => {
        const key = `${template.type}:${template.canonicalKey.toLocaleLowerCase()}`
        groups.set(key, [...(groups.get(key) || []), template])
      })

    return Array.from(groups.values())
      .map((templates) => {
        const aliases = Array.from(new Set(templates.flatMap((template) => template.aliases)))
        const representative = [...templates].sort(
          (first, second) => second.lastUsedAt.getTime() - first.lastUsedAt.getTime()
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
  }, [operationTemplates, title, type])

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
    const assetIndex = availableAssets.findIndex(
      (option) => option.accountId === template.accountId &&
        option.asset.id === template.assetId
    )
    if (assetIndex >= 0 && assetIndex !== currentAssetIndex) {
      onAssetChange?.(assetIndex)
    }
    setType(template.type)
    setTitle(template.title)
    setAmount('')
    setCategory(template.category)
    setPurposeId(template.purposeId || '')
    setComment('')
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

  useEffect(() => {
    if (
      !isEditMode &&
      !purposeId &&
      defaultPurposeId &&
      purposes.some((purpose) => purpose.id === defaultPurposeId)
    ) {
      setPurposeId(defaultPurposeId)
    }
  }, [defaultPurposeId, isEditMode, purposeId, purposes])

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

  // Populate form when editing
  useEffect(() => {
    if (editOperation) {
      setType(editOperation.type)
      setTitle(editOperation.title)
      setAmount(String(editOperation.amount))
      setCategory(editOperation.category || '')
      setComment(editOperation.comment || '')
      const date = editOperation.datetime.toDate()
      setDatetime(formatDateForInput(date))
      if (editOperation.rate) {
        setRate(String(editOperation.rate))
      }
      if (editOperation.purposeId) {
        setPurposeId(editOperation.purposeId)
      }
    } else {
      resetForm()
    }
  }, [editOperation, resetForm])

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

  const isValid = (() => {
    const baseValid = parseFloat(amount) > 0 && datetime
    if (isLoan) return baseValid && !!selectedLoan
    if (isTransfer) {
      return baseValid && title.trim() && targetAssetIndex >= 0 && parseFloat(rate) > 0
    }
    return baseValid && !!title.trim()
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    const data: OperationFormData = {
      type,
      title: isLoan && selectedLoan
        ? type === 'lend'
          ? `Loan to ${selectedLoan.borrowerTitle}`
          : `Repayment from ${selectedLoan.borrowerTitle}`
        : title.trim(),
      amount: parseFloat(amount),
      category: isLoan
        ? type === 'lend' ? 'Loan advance' : 'Loan repayment'
        : isTransfer ? 'Transfer' : category.trim(),
      comment: comment.trim(),
      datetime: new Date(datetime),
    }

    if (isTransfer && selectedTarget) {
      data.targetAccountId = selectedTarget.accountId
      data.targetAssetId = selectedTarget.asset.id
      data.rate = parseFloat(rate)
    }
    if (isLoan && selectedLoan) {
      data.loanMutualId = selectedLoan.mutualId
    }

    // Add purpose for mutual expenses
    if (
      purposeId &&
      type === 'payment' &&
      purposes.some((purpose) => purpose.id === purposeId)
    ) {
      data.purposeId = purposeId
    }

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

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(category.toLowerCase())
  )

  const targetAmount =
    isTransfer && selectedTarget
      ? (parseFloat(amount) || 0) * (parseFloat(rate) || 1)
      : 0

  const submitLabel = isSubmitting
    ? 'Saving...'
    : isEditMode
    ? 'Update Operation'
    : type === 'payment'
    ? 'Add Payment'
    : type === 'income'
    ? 'Add Income'
    : type === 'lend'
    ? 'Record Loan'
    : type === 'repay'
    ? 'Record Repayment'
    : 'Transfer'

  return (
    <form
      className={`${styles.form} ${compact ? styles.compactForm : ''}`}
      onSubmit={handleSubmit}
    >
      {showContextControls && (compact || simpleMode) && availableAssets.length > 1 && onAssetChange && (
        <div className={styles.compactAssetSelector}>
          <label htmlFor="operation-asset-select">Asset</label>
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
          <span>Payment</span>
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
          onClick={() => setType('income')}
          disabled={isEditMode && editOperation?.type === 'transfer'}
        >
          <CirclePlus className={styles.typeIcon} aria-hidden="true" />
          <span>Income</span>
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
            <span>Transfer</span>
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
              <span>Lend</span>
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'repay' ? styles.activeRepay : ''}`}
              onClick={() => setType('repay')}
              disabled={isEditMode || loanOptionsForAsset.length === 0}
            >
              <ArrowDownLeft className={styles.typeIcon} aria-hidden="true" />
              <span>Repay</span>
            </button>
          </>
        )}
      </div>}

      {isLoan ? (
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="loanMutual">Loan relationship *</label>
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
            <label htmlFor="amount">Amount *</label>
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
            <label htmlFor="title">Title *</label>
            <div className={styles.titleInput} ref={titleInputRef}>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isTransfer ? 'Transfer description' : 'What was it for?'}
                required
              />
              {!isEditMode && !isTransfer && operationTemplates.some(
                (template) => template.type === type
              ) && (
                <button
                  type="button"
                  className={styles.templateButton}
                  onClick={() => {
                    setShowTemplates((visible) => !visible)
                    requestAnimationFrame(() => {
                      titleInputRef.current?.querySelector('input')?.focus()
                    })
                  }}
                  aria-label="Choose an operation from history"
                  aria-expanded={showTemplates}
                  title="Choose from history"
                >
                  <History aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="amount">Amount *</label>
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
              <label htmlFor="targetAsset">Transfer To *</label>
              <select
                id="targetAsset"
                value={targetAssetIndex}
                onChange={(e) => setTargetAssetIndex(parseInt(e.target.value, 10))}
                required
              >
                <option value={-1}>Select destination asset...</option>
                {transferTargets.map((option, index) => (
                  <option key={`${option.accountId}-${option.asset.id}`} value={index}>
                    {option.accountTitle} → {option.asset.title} ({option.asset.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="rate">Exchange Rate</label>
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
              <span className={styles.previewLabel}>Recipient gets:</span>
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
            <label htmlFor="datetime">Date & Time *</label>
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
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setShowCategories(true)}
              placeholder="e.g. Food, Transport"
              autoComplete="off"
            />
            {showCategories && filteredCategories.length > 0 && (
              <div className={styles.dropdown}>
                {filteredCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setCategory(cat)
                      setShowCategories(false)
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="datetime">Date & Time *</label>
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
            <label htmlFor="datetime">Date & Time *</label>
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
          <label htmlFor="purpose">Shared Expense Purpose</label>
          <select
            id="purpose"
            value={purposeId}
            onChange={(e) => setPurposeId(e.target.value)}
            className={styles.purposeSelect}
          >
            <option value="">Private expense (not shared)</option>
            {purposes.filter(p => !p.isSettlement).map((purpose) => (
              <option key={purpose.id} value={purpose.id}>
                {getPurposeIcon(purpose.icon)} {purpose.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={`${styles.field} ${styles.commentField}`}>
        <label htmlFor="comment">Comment</label>
        <div className={styles.commentInput}>
          <input
            id="comment"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional notes..."
          />
          <button
            type="button"
            className={styles.commentItemsButton}
            onClick={openCommentSuggestions}
            aria-label="Choose or add comment items"
            aria-expanded={showCommentSuggestions}
            title="Choose comment items"
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
          aria-label="Previous operations"
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
            <div className={styles.templateEmpty}>No matching operations</div>
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
              <h3 id="comment-suggestions-title">Comment items</h3>
              <button
                type="button"
                className={styles.selectionClose}
                onClick={() => setShowCommentSuggestions(false)}
                aria-label="Close comment items"
                title="Close"
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
                  placeholder="Add a new comment item"
                  aria-label="New comment item"
                />
                <button
                  type="button"
                  onClick={addCustomCommentItem}
                  disabled={!newCommentItem.trim()}
                  aria-label="Add comment item"
                  title="Add item"
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
                  <div className={styles.commentSuggestionEmpty}>No saved comment items</div>
                )}
              </div>
              <div className={styles.commentSuggestionActions}>
                <button type="button" onClick={() => setShowCommentSuggestions(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.commentSuggestionApply}
                  onClick={applyCommentSuggestions}
                  disabled={selectedCommentItems.size === 0}
                >
                  Apply
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
  )
}
