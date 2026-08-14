import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  compact = false,
}: OperationFormProps) {
  const [type, setType] = useState<OperationType | 'lend' | 'repay'>('payment')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [comment, setComment] = useState('')
  const [purposeId, setPurposeId] = useState('')
  const [datetime, setDatetime] = useState(() => formatDateForInput(new Date()))
  const [showCategories, setShowCategories] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)
  const templateRef = useRef<HTMLDivElement>(null)

  // Transfer state
  const [targetAssetIndex, setTargetAssetIndex] = useState<number>(-1)
  const [rate, setRate] = useState('1')
  const [loanMutualId, setLoanMutualId] = useState('')

  const resetForm = useCallback(() => {
    setType('payment')
    setTitle('')
    setAmount('')
    setCategory('')
    setComment('')
    setDatetime(formatDateForInput(new Date()))
    setTargetAssetIndex(-1)
    setRate('1')
    setPurposeId('')
    setLoanMutualId('')
  }, [])

  const isEditMode = !!editOperation
  const isTransfer = type === 'transfer'
  const isLoan = type === 'lend' || type === 'repay'
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

    const closeTemplates = (event: MouseEvent) => {
      if (!templateRef.current?.contains(event.target as Node)) {
        setShowTemplates(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTemplates(false)
    }
    document.addEventListener('mousedown', closeTemplates)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeTemplates)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showTemplates])

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
    if (purposeId && type === 'payment') {
      data.purposeId = purposeId
    }

    await onSubmit(data)

    if (!isEditMode) {
      resetForm()
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
      {compact && availableAssets.length > 1 && onAssetChange && (
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

      <div className={styles.typeToggle}>
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
      </div>

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
            <div className={styles.titleInput} ref={templateRef}>
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
                  onClick={() => setShowTemplates((visible) => !visible)}
                  aria-label="Choose an operation from history"
                  aria-expanded={showTemplates}
                  title="Choose from history"
                >
                  <History aria-hidden="true" />
                </button>
              )}
              {showTemplates && (
                <div className={styles.templatePopover} role="listbox" aria-label="Previous operations">
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
                </div>
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
      {type === 'payment' && purposes.length > 0 && (
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
          {purposeId && (
            <p className={styles.purposeHint}>
              🤝 This expense will be shared with other participants
            </p>
          )}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="comment">Comment</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional notes..."
          rows={2}
        />
      </div>

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
