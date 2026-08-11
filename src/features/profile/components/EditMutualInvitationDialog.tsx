import { useEffect, useState } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'

interface EditMutualInvitationDialogProps {
  isOpen: boolean
  mutualTitle: string
  currentEmail: string
  currentUserEmail?: string
  onSave: (email: string) => Promise<void>
  onCancel: () => void
}

export function EditMutualInvitationDialog({
  isOpen,
  mutualTitle,
  currentEmail,
  currentUserEmail,
  onSave,
  onCancel,
}: EditMutualInvitationDialogProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmail(currentEmail)
      setError('')
    }
  }, [currentEmail, isOpen])

  const handleSave = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    const emailPattern = /^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/
    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address')
      return
    }
    if (normalizedEmail === currentUserEmail?.trim().toLowerCase()) {
      setError('Use the other participant\'s email address')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave(normalizedEmail)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to update the invitation.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      title={`Invite to ${mutualTitle}`}
      icon="✉"
      submitLabel="Update invitation"
      isLoading={isSaving}
      onSubmit={handleSave}
      onCancel={onCancel}
    >
      <FormField label="Participant email" required error={error}>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
          }}
          placeholder="friend@example.com"
          autoComplete="email"
          disabled={isSaving}
        />
      </FormField>
    </FormDialog>
  )
}
