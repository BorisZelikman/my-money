import { useState, useEffect } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import { DEFAULT_CURRENCIES } from '@/types/currency'
import type { Asset, AccountWithUsers } from '@/types'

interface AssetDialogProps {
  isOpen: boolean
  asset?: Asset | null // null = add new, Asset = edit
  accounts: AccountWithUsers[] // Available accounts to choose from
  onSave: (data: {
    title: string
    accountId: string
    currency: string
    amount: number
    comment: string
  }) => Promise<void>
  onCancel: () => void
}

export function AssetDialog({
  isOpen,
  asset,
  accounts,
  onSave,
  onCancel,
}: AssetDialogProps) {
  const [title, setTitle] = useState('')
  const [accountId, setAccountId] = useState('')
  const [currency, setCurrency] = useState('ILS')
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = !!asset

  // Reset form when dialog opens/closes or asset changes
  useEffect(() => {
    if (isOpen) {
      if (asset) {
        setTitle(asset.title)
        setAccountId(asset.accountId)
        setCurrency(asset.currency)
        setAmount(asset.amount.toString())
        setComment(asset.comment || '')
      } else {
        setTitle('')
        setAccountId(accounts[0]?.id || '')
        setCurrency('ILS')
        setAmount('0')
        setComment('')
      }
      setErrors({})
    }
  }, [isOpen, asset, accounts])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!accountId) {
      newErrors.accountId = 'Account is required'
    }
    if (!currency) {
      newErrors.currency = 'Currency is required'
    }
    if (amount === '' || isNaN(parseFloat(amount))) {
      newErrors.amount = 'Valid amount is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsLoading(true)

    try {
      await onSave({
        title: title.trim(),
        accountId,
        currency,
        amount: parseFloat(amount),
        comment: comment.trim(),
      })
    } catch (err) {
      setErrors({ form: 'Failed to save asset. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      title={isEditMode ? 'Edit Asset' : 'Add Asset'}
      icon="💳"
      submitLabel={isEditMode ? 'Update' : 'Create'}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <FormField label="Asset Name" required error={errors.title}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((prev) => ({ ...prev, title: '' }))
          }}
          placeholder="e.g., Cash, Bank Account, Credit Card"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Account" required error={errors.accountId}>
        <select
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value)
            setErrors((prev) => ({ ...prev, accountId: '' }))
          }}
          disabled={isLoading || isEditMode}
        >
          {accounts.length === 0 && (
            <option value="">No accounts available</option>
          )}
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.title}
            </option>
          ))}
        </select>
      </FormField>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <FormField label="Currency" required error={errors.currency}>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value)
              setErrors((prev) => ({ ...prev, currency: '' }))
            }}
            disabled={isLoading}
          >
            {Object.entries(DEFAULT_CURRENCIES).map(([code, curr]) => (
              <option key={code} value={code}>
                {curr.symbol} {code}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Initial Amount" required error={errors.amount}>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setErrors((prev) => ({ ...prev, amount: '' }))
            }}
            placeholder="0.00"
            disabled={isLoading}
          />
        </FormField>
      </div>

      <FormField label="Comment" error={errors.comment}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional notes about this asset..."
          disabled={isLoading}
        />
      </FormField>

      {errors.form && (
        <div style={{ 
          color: 'var(--color-accent-danger)', 
          fontSize: 'var(--text-sm)',
          textAlign: 'center'
        }}>
          {errors.form}
        </div>
      )}
    </FormDialog>
  )
}

