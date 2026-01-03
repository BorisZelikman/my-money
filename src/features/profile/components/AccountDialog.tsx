import { useState, useEffect } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import type { Account } from '@/types'

interface AccountDialogProps {
  isOpen: boolean
  account?: Account | null // null = add new, Account = edit
  onSave: (data: { title: string }) => Promise<void>
  onCancel: () => void
}

export function AccountDialog({
  isOpen,
  account,
  onSave,
  onCancel,
}: AccountDialogProps) {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = !!account

  // Reset form when dialog opens/closes or account changes
  useEffect(() => {
    if (isOpen) {
      setTitle(account?.title || '')
      setError(null)
    }
  }, [isOpen, account])

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave({ title: title.trim() })
    } catch (err) {
      setError('Failed to save account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      title={isEditMode ? 'Edit Account' : 'Add Account'}
      icon="💼"
      submitLabel={isEditMode ? 'Update' : 'Create'}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <FormField label="Account Name" required error={error || undefined}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
          }}
          placeholder="e.g., Family Budget, Personal"
          disabled={isLoading}
        />
      </FormField>

      {isEditMode && account && (
        <div style={{ 
          fontSize: 'var(--text-xs)', 
          color: 'var(--color-text-muted)',
          marginTop: 'var(--space-sm)'
        }}>
          Account ID: {account.id}
        </div>
      )}
    </FormDialog>
  )
}

