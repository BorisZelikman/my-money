import { useEffect, useState } from 'react'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import type { AccountWithUsers, Asset, MutualInvitation } from '@/types'
import styles from './MutualInvitations.module.css'

interface MutualInvitationsProps {
  invitations: MutualInvitation[]
  accounts: AccountWithUsers[]
  onAccept: (
    invitation: MutualInvitation,
    accountId: string,
    assetId: string
  ) => Promise<void>
  onDecline: (invitation: MutualInvitation) => Promise<void>
}

export function MutualInvitations({
  invitations,
  accounts,
  onAccept,
  onDecline,
}: MutualInvitationsProps) {
  const [selectedInvitation, setSelectedInvitation] = useState<MutualInvitation | null>(null)
  const [accountId, setAccountId] = useState('')
  const [assetId, setAssetId] = useState('')
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedInvitation) return
    setAccountId(accounts[0]?.id || '')
    setAssetId('')
    setError('')
  }, [selectedInvitation, accounts])

  useEffect(() => {
    let cancelled = false

    async function loadAssets() {
      if (!selectedInvitation || !accountId) {
        setAssets([])
        setAssetId('')
        return
      }

      setIsLoadingAssets(true)
      try {
        const accountAssets = await getAssetsByAccountId(accountId)
        if (cancelled) return
        const ilsAssets = accountAssets.filter((asset) => asset.currency === 'ILS')
        setAssets(ilsAssets)
        setAssetId(ilsAssets[0]?.id || '')
      } catch {
        if (!cancelled) setError('Failed to load assets for this account.')
      } finally {
        if (!cancelled) setIsLoadingAssets(false)
      }
    }

    loadAssets()
    return () => {
      cancelled = true
    }
  }, [selectedInvitation, accountId])

  const handleAccept = async () => {
    if (!selectedInvitation) return
    if (!accountId) {
      setError('Create and select an account first.')
      return
    }
    if (!assetId) {
      setError('Create and select an ILS asset first.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onAccept(selectedInvitation, accountId, assetId)
      setSelectedInvitation(null)
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'Failed to accept the invitation.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDecline = async (invitation: MutualInvitation) => {
    setDecliningId(invitation.mutualId)
    try {
      await onDecline(invitation)
    } finally {
      setDecliningId(null)
    }
  }

  if (invitations.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="pending-invitations-title">
      <div className={styles.headingRow}>
        <h3 id="pending-invitations-title">Pending invitations</h3>
        <span className={styles.count}>{invitations.length}</span>
      </div>

      <div className={styles.list}>
        {invitations.map((invitation) => (
          <article key={`${invitation.mutualId}-${invitation.id}`} className={styles.card}>
            <div className={styles.invitationIcon} aria-hidden="true">✉</div>
            <div className={styles.details}>
              <strong>{invitation.mutualTitle}</strong>
              <span>
                {invitation.inviterName} · {invitation.inviterAccountTitle}
              </span>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.declineButton}
                onClick={() => handleDecline(invitation)}
                disabled={decliningId === invitation.mutualId}
              >
                Decline
              </button>
              <button
                type="button"
                className={styles.reviewButton}
                onClick={() => setSelectedInvitation(invitation)}
              >
                Review
              </button>
            </div>
          </article>
        ))}
      </div>

      <FormDialog
        isOpen={!!selectedInvitation}
        title="Accept shared group"
        icon="🤝"
        submitLabel="Accept invitation"
        isLoading={isSaving}
        onSubmit={handleAccept}
        onCancel={() => setSelectedInvitation(null)}
      >
        <div className={styles.summary}>
          <strong>{selectedInvitation?.mutualTitle}</strong>
          <span>Your share coefficient: {selectedInvitation?.inviteeRate}</span>
        </div>

        <FormField label="Your account" required>
          <select
            value={accountId}
            onChange={(event) => {
              setAccountId(event.target.value)
              setError('')
            }}
            disabled={isSaving}
          >
            {accounts.length === 0 && <option value="">No accounts available</option>}
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.title}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Default ILS asset" required>
          <select
            value={assetId}
            onChange={(event) => {
              setAssetId(event.target.value)
              setError('')
            }}
            disabled={isSaving || isLoadingAssets || !accountId}
          >
            {assets.length === 0 && (
              <option value="">
                {isLoadingAssets ? 'Loading assets...' : 'No ILS assets available'}
              </option>
            )}
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.title} ({asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪)
              </option>
            ))}
          </select>
        </FormField>

        {error && <div className={styles.error}>{error}</div>}
        {accounts.length === 0 && (
          <p className={styles.help}>Close this dialog and create an account first.</p>
        )}
        {accountId && !isLoadingAssets && assets.length === 0 && (
          <p className={styles.help}>Close this dialog and add an ILS asset to the account first.</p>
        )}
      </FormDialog>
    </section>
  )
}
