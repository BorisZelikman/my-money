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
  currentUserEmail?: string
  onSave: (data: {
    title: string
    participants: { accountId: string; rate: number }[]
    inviteeEmail?: string
    inviteeRate?: number
    type: 'shared-expenses' | 'loan'
    counterpartyName?: string
  }) => Promise<void>
  onCancel: () => void
}

export function MutualDialog({
  isOpen,
  mutual,
  accounts,
  currentUserEmail,
  onSave,
  onCancel,
}: MutualDialogProps) {
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState<ParticipantInput[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteeRate, setInviteeRate] = useState('1')
  const [groupType, setGroupType] = useState<'shared-expenses' | 'loan'>('shared-expenses')
  const [counterpartyName, setCounterpartyName] = useState('')
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
      setInviteeEmail('')
      setInviteeRate('1')
      setGroupType(mutual?.type || 'shared-expenses')
      setCounterpartyName(mutual?.counterpartyName || '')
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
    const normalizedEmail = inviteeEmail.trim().toLowerCase()
    if (participants.length < 1) {
      newErrors.participants = 'Select at least one of your accounts'
    } else if (
      groupType === 'shared-expenses' &&
      !isEditMode &&
      participants.length < 2 &&
      !normalizedEmail
    ) {
      newErrors.participants = 'Add another account or invite a participant by email'
    }
    if (groupType === 'loan' && !counterpartyName.trim()) {
      newErrors.counterpartyName = 'Borrower name is required'
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

    if (!isEditMode && normalizedEmail) {
      const emailPattern = /^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/
      if (!emailPattern.test(normalizedEmail)) {
        newErrors.inviteeEmail = 'Enter a valid email address'
      } else if (normalizedEmail === currentUserEmail?.trim().toLowerCase()) {
        newErrors.inviteeEmail = 'Use the other participant\'s email address'
      }

      const rate = parseFloat(inviteeRate)
      if (!Number.isFinite(rate) || rate <= 0) {
        newErrors.inviteeRate = 'Share must be greater than zero'
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
        inviteeEmail: !isEditMode && inviteeEmail.trim()
          ? inviteeEmail.trim().toLowerCase()
          : undefined,
        inviteeRate: !isEditMode && inviteeEmail.trim()
          ? parseFloat(inviteeRate)
          : undefined,
        type: groupType,
        counterpartyName: groupType === 'loan' ? counterpartyName.trim() : undefined,
      })
    } catch {
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
      title={groupType === 'loan'
        ? isEditMode ? 'Edit Loan Group' : 'Add Loan Group'
        : isEditMode ? 'Edit Shared Expenses Group' : 'Add Shared Expenses Group'}
      icon="🤝"
      submitLabel={isEditMode ? 'Update' : 'Create'}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      {!isEditMode && (
        <FormField label="Group Type" required>
          <select
            value={groupType}
            onChange={(event) => {
              const nextType = event.target.value as 'shared-expenses' | 'loan'
              setGroupType(nextType)
              if (nextType === 'loan') {
                setParticipants((current) => current.slice(0, 1))
              }
              setErrors({})
            }}
            disabled={isLoading}
          >
            <option value="shared-expenses">Shared expenses</option>
            <option value="loan">Loan</option>
          </select>
        </FormField>
      )}

      <FormField label="Group Name" required error={errors.title}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((prev) => ({ ...prev, title: '' }))
          }}
          placeholder={groupType === 'loan'
            ? 'e.g., Loan with Anton'
            : 'e.g., Household, Vacation Trip'}
          disabled={isLoading}
        />
      </FormField>

      <div className={styles.participantsSection}>
        <div className={styles.participantsHeader}>
          <span className={styles.participantsLabel}>
            {groupType === 'loan' ? 'Lender account' : 'Participants'}
            <span className={styles.required}>*</span>
          </span>
          {groupType === 'shared-expenses' && canAddParticipant && (
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
            <div
              key={index}
              className={`${styles.participantRow} ${
                groupType === 'loan' ? styles.loanParticipantRow : ''
              }`}
            >
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
                    {acc.title} ({acc.userNames.join(', ')})
                  </option>
                ))}
              </select>

              {groupType === 'shared-expenses' && (
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={participant.rate}
                  onChange={(e) => updateParticipant(index, 'rate', e.target.value)}
                  disabled={isLoading}
                  className={styles.rateInput}
                  placeholder="Rate"
                  aria-label="Share coefficient"
                />
              )}

              {groupType === 'shared-expenses' && participants.length > 1 && (
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

        {groupType === 'shared-expenses' && (
          <div className={styles.rateHint}>
            Rate determines the share of expenses (e.g., 0.5 = 50%, 1 = equal share)
          </div>
        )}
      </div>

      {!isEditMode && (
        <div className={styles.invitationSection}>
          <div className={styles.sectionDivider}>
            <span>Invite another user</span>
          </div>
          <div className={styles.invitationRow}>
            {groupType === 'loan' && (
              <div className={styles.counterpartyField}>
                <FormField label="Borrower name" required error={errors.counterpartyName}>
                  <input
                    type="text"
                    value={counterpartyName}
                    onChange={(event) => {
                      setCounterpartyName(event.target.value)
                      setErrors((previous) => ({ ...previous, counterpartyName: '' }))
                    }}
                    placeholder="e.g., Avbor"
                    disabled={isLoading}
                  />
                </FormField>
              </div>
            )}
            <FormField label="Email" error={errors.inviteeEmail}>
              <input
                type="email"
                value={inviteeEmail}
                onChange={(event) => {
                  setInviteeEmail(event.target.value)
                  setErrors((previous) => ({ ...previous, inviteeEmail: '' }))
                }}
                placeholder="friend@example.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </FormField>
            {groupType === 'shared-expenses' && (
            <FormField label="Share" error={errors.inviteeRate}>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={inviteeRate}
                onChange={(event) => {
                  setInviteeRate(event.target.value)
                  setErrors((previous) => ({ ...previous, inviteeRate: '' }))
                }}
                disabled={isLoading || !inviteeEmail.trim()}
              />
            </FormField>
            )}
          </div>
          <p className={styles.invitationHint}>
            Email is optional. If they join, they will choose their own account and ILS asset.
          </p>
        </div>
      )}

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

