import { useState, useEffect } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import type { Mutual, AccountWithUsers } from '@/types'
import styles from './MutualDialog.module.css'

interface ParticipantInput {
  accountId: string
  rate: string
}

interface MutualDialogProps {
  isOpen: boolean
  mutual?: Mutual | null // null = add new, Mutual = edit
  accounts: AccountWithUsers[] // Available accounts to add as participants
  onSave: (data: {
    title: string
    participants: { accountId: string; rate: number }[]
  }) => Promise<void>
  onCancel: () => void
}

export function MutualDialog({
  isOpen,
  mutual,
  accounts,
  onSave,
  onCancel,
}: MutualDialogProps) {
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState<ParticipantInput[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = !!mutual

  // Reset form when dialog opens/closes or mutual changes
  useEffect(() => {
    if (isOpen) {
      if (mutual) {
        setTitle(mutual.title)
        setParticipants(
          mutual.participants.map((p) => ({
            accountId: p.accountId,
            rate: p.rate.toString(),
          }))
        )
      } else {
        setTitle('')
        // Start with first account if available
        setParticipants(
          accounts.length > 0 
            ? [{ accountId: accounts[0].id, rate: '1' }] 
            : []
        )
      }
      setErrors({})
    }
  }, [isOpen, mutual, accounts])

  const addParticipant = () => {
    // Find first account not already in participants
    const usedAccountIds = new Set(participants.map((p) => p.accountId))
    const availableAccount = accounts.find((acc) => !usedAccountIds.has(acc.id))
    
    if (availableAccount) {
      setParticipants([...participants, { accountId: availableAccount.id, rate: '1' }])
    }
  }

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const updateParticipant = (index: number, field: 'accountId' | 'rate', value: string) => {
    const updated = [...participants]
    updated[index] = { ...updated[index], [field]: value }
    setParticipants(updated)
    setErrors({})
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (participants.length < 2) {
      newErrors.participants = 'At least 2 participants are required'
    }

    // Check for duplicate accounts
    const accountIds = participants.map((p) => p.accountId)
    const uniqueAccountIds = new Set(accountIds)
    if (accountIds.length !== uniqueAccountIds.size) {
      newErrors.participants = 'Each account can only be added once'
    }

    // Check for valid rates
    for (const p of participants) {
      const rate = parseFloat(p.rate)
      if (isNaN(rate) || rate <= 0) {
        newErrors.participants = 'All rates must be positive numbers'
        break
      }
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
        participants: participants.map((p) => ({
          accountId: p.accountId,
          rate: parseFloat(p.rate),
        })),
      })
    } catch (err) {
      setErrors({ form: 'Failed to save mutual. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const usedAccountIds = new Set(participants.map((p) => p.accountId))
  const canAddParticipant = accounts.some((acc) => !usedAccountIds.has(acc.id))

  return (
    <FormDialog
      isOpen={isOpen}
      title={isEditMode ? 'Edit Shared Expenses Group' : 'Add Shared Expenses Group'}
      icon="🤝"
      submitLabel={isEditMode ? 'Update' : 'Create'}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <FormField label="Group Name" required error={errors.title}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((prev) => ({ ...prev, title: '' }))
          }}
          placeholder="e.g., Household, Vacation Trip"
          disabled={isLoading}
        />
      </FormField>

      <div className={styles.participantsSection}>
        <div className={styles.participantsHeader}>
          <span className={styles.participantsLabel}>
            Participants
            <span className={styles.required}>*</span>
          </span>
          {canAddParticipant && (
            <button
              type="button"
              className={styles.addParticipantBtn}
              onClick={addParticipant}
              disabled={isLoading}
            >
              + Add
            </button>
          )}
        </div>

        {errors.participants && (
          <div className={styles.participantsError}>{errors.participants}</div>
        )}

        <div className={styles.participantsList}>
          {participants.map((participant, index) => (
            <div key={index} className={styles.participantRow}>
              <select
                value={participant.accountId}
                onChange={(e) => updateParticipant(index, 'accountId', e.target.value)}
                disabled={isLoading}
                className={styles.accountSelect}
              >
                {accounts.map((acc) => (
                  <option
                    key={acc.id}
                    value={acc.id}
                    disabled={usedAccountIds.has(acc.id) && acc.id !== participant.accountId}
                  >
                    {acc.title}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.1"
                min="0.1"
                value={participant.rate}
                onChange={(e) => updateParticipant(index, 'rate', e.target.value)}
                disabled={isLoading}
                className={styles.rateInput}
                placeholder="Rate"
              />

              {participants.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeParticipant(index)}
                  disabled={isLoading}
                  aria-label="Remove participant"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.rateHint}>
          Rate determines the share of expenses (e.g., 0.5 = 50%, 1 = equal share)
        </div>
      </div>

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

