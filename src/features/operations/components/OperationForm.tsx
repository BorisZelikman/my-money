import { useState, useEffect, useRef } from 'react'
import type { OperationType, Operation, Asset, MutualPurpose } from '@/types'
import styles from './OperationForm.module.css'

interface AssetOption {
  accountId: string
  accountTitle: string
  asset: Asset
}

export interface OperationFormData {
  type: OperationType
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
  // For mutuals
  purposes?: MutualPurpose[]
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
  purposes = [],
}: OperationFormProps) {
  const [type, setType] = useState<OperationType>('payment')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [comment, setComment] = useState('')
  const [purposeId, setPurposeId] = useState('')
  const [datetime, setDatetime] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  // Transfer state
  const [targetAssetIndex, setTargetAssetIndex] = useState<number>(-1)
  const [rate, setRate] = useState('1')

  const isEditMode = !!editOperation
  const isTransfer = type === 'transfer'

  // Filter out current asset from transfer targets
  const transferTargets = availableAssets.filter(
    (opt) =>
      !(
        opt.accountId === currentAsset?.accountId &&
        opt.asset.id === currentAsset?.asset.id
      )
  )

  const selectedTarget = targetAssetIndex >= 0 ? transferTargets[targetAssetIndex] : null

  // Auto-set rate when currencies differ
  useEffect(() => {
    if (isTransfer && selectedTarget && currentAsset) {
      if (currentAsset.asset.currency === selectedTarget.asset.currency) {
        setRate('1')
      }
      // Could fetch real exchange rate here
    }
  }, [isTransfer, selectedTarget, currentAsset])

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
  }, [editOperation])

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

  const formatDateForInput = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16)
  }

  const resetForm = () => {
    setType('payment')
    setTitle('')
    setAmount('')
    setCategory('')
    setComment('')
    setDatetime(formatDateForInput(new Date()))
    setTargetAssetIndex(-1)
    setRate('1')
    setPurposeId('')
  }

  const isValid = (() => {
    const baseValid = title.trim() && parseFloat(amount) > 0 && datetime
    if (isTransfer) {
      return baseValid && targetAssetIndex >= 0 && parseFloat(rate) > 0
    }
    return baseValid
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    const data: OperationFormData = {
      type,
      title: title.trim(),
      amount: parseFloat(amount),
      category: isTransfer ? 'Transfer' : category.trim(),
      comment: comment.trim(),
      datetime: new Date(datetime),
    }

    if (isTransfer && selectedTarget) {
      data.targetAccountId = selectedTarget.accountId
      data.targetAssetId = selectedTarget.asset.id
      data.rate = parseFloat(rate)
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'payment' ? styles.activePayment : ''}`}
          onClick={() => setType('payment')}
          disabled={isEditMode && editOperation?.type === 'transfer'}
        >
          <span className={styles.typeIcon}>💸</span>
          Payment
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
          onClick={() => setType('income')}
          disabled={isEditMode && editOperation?.type === 'transfer'}
        >
          <span className={styles.typeIcon}>💰</span>
          Income
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'transfer' ? styles.activeTransfer : ''}`}
          onClick={() => setType('transfer')}
          disabled={isEditMode || transferTargets.length === 0}
          title={transferTargets.length === 0 ? 'No other assets to transfer to' : ''}
        >
          <span className={styles.typeIcon}>🔄</span>
          Transfer
        </button>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isTransfer ? 'Transfer description' : 'What was it for?'}
            required
          />
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
                {purpose.icon} {purpose.title}
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
              🗑️ Delete
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
              : styles.transferBtn
          }`}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : isEditMode
            ? 'Update Operation'
            : type === 'payment'
            ? 'Add Payment'
            : type === 'income'
            ? 'Add Income'
            : 'Transfer'}
        </button>
      </div>
    </form>
  )
}
