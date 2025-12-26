import { useState, useEffect, useRef } from 'react'
import type { OperationType, Operation } from '@/types'
import styles from './OperationForm.module.css'

interface OperationFormProps {
  onSubmit: (data: {
    type: OperationType
    title: string
    amount: number
    category: string
    comment: string
    datetime: Date
  }) => Promise<void>
  onDelete?: () => void
  categories: string[]
  editOperation?: Operation | null
  onCancelEdit?: () => void
  isSubmitting?: boolean
}

export function OperationForm({
  onSubmit,
  onDelete,
  categories,
  editOperation,
  onCancelEdit,
  isSubmitting = false,
}: OperationFormProps) {
  const [type, setType] = useState<OperationType>('payment')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [comment, setComment] = useState('')
  const [datetime, setDatetime] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  const isEditMode = !!editOperation

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
  }

  const isValid = title.trim() && parseFloat(amount) > 0 && datetime

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    await onSubmit({
      type,
      title: title.trim(),
      amount: parseFloat(amount),
      category: category.trim(),
      comment: comment.trim(),
      datetime: new Date(datetime),
    })

    if (!isEditMode) {
      resetForm()
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(category.toLowerCase())
  )

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'payment' ? styles.activePayment : ''}`}
          onClick={() => setType('payment')}
        >
          <span className={styles.typeIcon}>💸</span>
          Payment
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
          onClick={() => setType('income')}
        >
          <span className={styles.typeIcon}>💰</span>
          Income
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
            placeholder="What was it for?"
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
          className={`${styles.submitBtn} ${type === 'payment' ? styles.paymentBtn : styles.incomeBtn}`}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : isEditMode
            ? 'Update Operation'
            : type === 'payment'
            ? 'Add Payment'
            : 'Add Income'}
        </button>
      </div>
    </form>
  )
}

