import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ui'
import { FormDialog, FormField } from '@/components/ui/FormDialog'
import type {
  Asset,
  LoanEntry,
  LoanEntryKind,
  LoanLedger as LoanLedgerData,
  Mutual,
} from '@/types'
import { formatAmount } from '@/utils/currency'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import {
  applyLoanEntry,
  getLoanLedger,
  updateLoanEntryDetails,
} from '../services/loanService'
import styles from './LoanLedger.module.css'

interface LoanLedgerProps {
  mutual: Mutual
  accountTitles: Record<string, string>
  assetsByAccount: Record<string, Asset[]>
  memberUserIds: string[]
  userId: string
  userName: string
  onAssetsChanged: () => Promise<void>
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function formatEntryDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function entryDelta(kind: LoanEntryKind, amount: number) {
  return kind === 'repayment' ? -amount : amount
}

const entryLabels: Record<LoanEntryKind, string> = {
  'opening-balance': 'Opening balance',
  advance: 'Lend money',
  repayment: 'Repayment',
}

export function LoanLedger({
  mutual,
  accountTitles,
  assetsByAccount,
  memberUserIds,
  userId,
  userName,
  onAssetsChanged,
}: LoanLedgerProps) {
  const [ledger, setLedger] = useState<LoanLedgerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [kind, setKind] = useState<LoanEntryKind>('opening-balance')
  const [lenderAccountId, setLenderAccountId] = useState('')
  const [borrowerAccountId, setBorrowerAccountId] = useState('')
  const [lenderAssetId, setLenderAssetId] = useState('')
  const [borrowerAssetId, setBorrowerAssetId] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => formatDateForInput(new Date()))
  const [comment, setComment] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LoanEntry | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editComment, setEditComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const isSavingRef = useRef(false)
  const lenderAssetWasSelected = useRef(false)
  const borrowerAssetWasSelected = useRef(false)

  const loadLedger = useCallback(async () => {
    try {
      setIsLoading(true)
      const loadedLedger = await getLoanLedger(mutual.id)
      setLedger(loadedLedger)
      if (loadedLedger) {
        setLenderAccountId(loadedLedger.lenderAccountId)
        setBorrowerAccountId(loadedLedger.borrowerAccountId)
        setKind('advance')
      } else if (mutual.participants.length === 2) {
        setLenderAccountId(mutual.participants[0].accountId)
        setBorrowerAccountId(mutual.participants[1].accountId)
        setKind('opening-balance')
      }
    } catch (error) {
      // Loan rules may not be deployed yet; keep the empty setup available.
      logger.error('Error loading loan ledger', error)
      setLedger(null)
      if (mutual.participants.length === 2) {
        setLenderAccountId(mutual.participants[0].accountId)
        setBorrowerAccountId(mutual.participants[1].accountId)
      }
    } finally {
      setIsLoading(false)
    }
  }, [mutual])

  useEffect(() => {
    lenderAssetWasSelected.current = false
    borrowerAssetWasSelected.current = false
    setAmount('')
    setComment('')
    loadLedger()
  }, [loadLedger])

  const lenderAssets = useMemo(
    () => (assetsByAccount[lenderAccountId] || []).filter(
      (asset) => asset.currency === (ledger?.currency || 'ILS')
    ),
    [assetsByAccount, ledger?.currency, lenderAccountId]
  )
  const borrowerAssets = useMemo(
    () => (assetsByAccount[borrowerAccountId] || []).filter(
      (asset) => asset.currency === (ledger?.currency || 'ILS')
    ),
    [assetsByAccount, borrowerAccountId, ledger?.currency]
  )

  const lastKnownAssets = useMemo(() => {
    const lenderDefault = mutual.participants.find(
      (participant) => participant.accountId === lenderAccountId
    )?.defaultAssetId
    const borrowerDefault = mutual.participants.find(
      (participant) => participant.accountId === borrowerAccountId
    )?.defaultAssetId
    const lenderId = ledger?.entries.find((entry) => entry.lenderAssetId)?.lenderAssetId
      || lenderDefault
      || ''
    const borrowerId = ledger?.entries.find(
      (entry) => entry.borrowerAssetId
    )?.borrowerAssetId || borrowerDefault || ''
    return { lenderId, borrowerId }
  }, [borrowerAccountId, ledger?.entries, lenderAccountId, mutual.participants])

  useEffect(() => {
    setLenderAssetId((current) => {
      const currentExists = lenderAssets.some((asset) => asset.id === current)
      if (lenderAssetWasSelected.current && currentExists) return current
      const suggestedExists = lenderAssets.some((asset) => asset.id === lastKnownAssets.lenderId)
      return suggestedExists ? lastKnownAssets.lenderId : lenderAssets[0]?.id || ''
    })
    setBorrowerAssetId((current) => {
      const currentExists = borrowerAssets.some((asset) => asset.id === current)
      if (borrowerAssetWasSelected.current && currentExists) return current
      const suggestedExists = borrowerAssets.some(
        (asset) => asset.id === lastKnownAssets.borrowerId
      )
      return suggestedExists ? lastKnownAssets.borrowerId : borrowerAssets[0]?.id || ''
    })
  }, [borrowerAssets, lastKnownAssets, lenderAssets])

  const balancesByEntry = useMemo(() => {
    if (!ledger) return new Map<string, number>()
    const result = new Map<string, number>()
    let runningBalance = 0
    const chronological = [...ledger.entries].sort((a, b) => {
      const dateDifference = a.occurredAt.getTime() - b.occurredAt.getTime()
      if (dateDifference !== 0) return dateDifference
      return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    })
    for (const entry of chronological) {
      runningBalance = Math.round(
        (runningBalance + entryDelta(entry.kind, entry.amount)) * 100
      ) / 100
      result.set(entry.id, runningBalance)
    }
    return result
  }, [ledger])

  if (mutual.participants.length !== 2) {
    return (
      <div className={styles.emptyState}>
        <h2>Loan Ledger</h2>
        <p>A loan ledger requires a Mutual with exactly two participant accounts.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Loading loan ledger...</p>
      </div>
    )
  }

  const lenderTitle = ledger?.lenderAccountTitle || accountTitles[lenderAccountId] || 'Lender'
  const borrowerTitle =
    ledger?.borrowerAccountTitle || accountTitles[borrowerAccountId] || 'Borrower'
  const lenderAsset = lenderAssets.find((asset) => asset.id === lenderAssetId)
  const borrowerAsset = borrowerAssets.find((asset) => asset.id === borrowerAssetId)
  const parsedAmount = Number(amount)
  const movesAssets = kind !== 'opening-balance'
  const canSave = Boolean(
    userId && occurredAt && Number.isFinite(parsedAmount) && parsedAmount > 0 &&
    (!movesAssets || (lenderAsset && borrowerAsset)) &&
    (kind !== 'repayment' || (ledger && parsedAmount <= ledger.balance))
  )

  const handleLenderChange = (accountId: string) => {
    const otherAccount = mutual.participants.find(
      (participant) => participant.accountId !== accountId
    )
    setLenderAccountId(accountId)
    setBorrowerAccountId(otherAccount?.accountId || '')
    lenderAssetWasSelected.current = false
    borrowerAssetWasSelected.current = false
  }

  const handleBorrowerChange = (accountId: string) => {
    const otherAccount = mutual.participants.find(
      (participant) => participant.accountId !== accountId
    )
    setBorrowerAccountId(accountId)
    setLenderAccountId(otherAccount?.accountId || '')
    lenderAssetWasSelected.current = false
    borrowerAssetWasSelected.current = false
  }

  const handleConfirm = async () => {
    if (!canSave || isSavingRef.current) return

    isSavingRef.current = true
    setIsSaving(true)
    try {
      await applyLoanEntry(mutual.id, {
        kind,
        lenderAccountId,
        lenderAccountTitle: lenderTitle,
        lenderAssetId: movesAssets ? lenderAsset?.id || null : null,
        lenderAssetTitle: movesAssets ? lenderAsset?.title || null : null,
        borrowerAccountId,
        borrowerAccountTitle: borrowerTitle,
        borrowerAssetId: movesAssets ? borrowerAsset?.id || null : null,
        borrowerAssetTitle: movesAssets ? borrowerAsset?.title || null : null,
        amount: parsedAmount,
        currency: ledger?.currency || 'ILS',
        occurredAt: parseInputDate(occurredAt),
        createdBy: userId,
        createdByName: userName,
        memberUserIds,
        comment: comment.trim(),
      })
      await Promise.all([loadLedger(), onAssetsChanged()])
      setAmount('')
      setComment('')
      setIsConfirmOpen(false)
      toast.success(`${entryLabels[kind]} recorded.`)
    } catch (error) {
      logger.error('Error recording loan entry', error)
      toast.error(error instanceof Error ? error.message : 'Failed to record loan entry.')
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  const handleEditEntry = (entry: LoanEntry) => {
    setEditingEntry(entry)
    setEditDate(formatDateForInput(entry.occurredAt))
    setEditComment(entry.comment)
  }

  const handleSaveEntryDetails = async () => {
    if (!editingEntry || !editDate || isEditing) return

    try {
      setIsEditing(true)
      await updateLoanEntryDetails(
        editingEntry.mutualId,
        editingEntry.ledgerId,
        editingEntry.id,
        {
          occurredAt: parseInputDate(editDate),
          comment: editComment,
          editedBy: userId,
        }
      )
      await loadLedger()
      setEditingEntry(null)
      toast.success('Loan entry updated.')
    } catch (error) {
      logger.error('Error updating loan entry', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update loan entry.')
    } finally {
      setIsEditing(false)
    }
  }

  const sourceTitle = kind === 'repayment' ? borrowerTitle : lenderTitle
  const targetTitle = kind === 'repayment' ? lenderTitle : borrowerTitle
  const confirmationMessage = kind === 'opening-balance'
    ? `Create a loan ledger where ${borrowerTitle} owes ${lenderTitle} ${formatAmount(parsedAmount || 0, 'ILS')} as of ${formatEntryDate(parseInputDate(occurredAt))}? Asset balances will not be changed.`
    : `Transfer ${formatAmount(parsedAmount || 0, 'ILS')} from ${sourceTitle} to ${targetTitle} on ${formatEntryDate(parseInputDate(occurredAt))} and update the debt balance?`

  return (
    <section className={styles.container}>
      <header className={styles.ledgerHeader}>
        <div>
          <span className={styles.eyebrow}>Current debt</span>
          <strong className={styles.balance}>
            {formatAmount(ledger?.balance || 0, ledger?.currency || 'ILS')}
          </strong>
        </div>
        <span className={styles.statusBadge}>
          {(ledger?.balance || 0) > 0 ? 'Active' : 'Settled'}
        </span>
      </header>

      <div className={styles.parties}>
        <div className={styles.partyOwed}>
          <span>{lenderTitle}</span>
          <strong>Is owed {formatAmount(ledger?.balance || 0, 'ILS')}</strong>
        </div>
        <div className={styles.partyOwes}>
          <span>{borrowerTitle}</span>
          <strong>Owes {formatAmount(ledger?.balance || 0, 'ILS')}</strong>
        </div>
      </div>

      <div className={styles.entryPanel}>
        <div className={styles.kindTabs} role="tablist" aria-label="Loan entry type">
          {!ledger && (
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'opening-balance'}
              className={kind === 'opening-balance' ? styles.activeTab : ''}
              onClick={() => setKind('opening-balance')}
            >
              Opening balance
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'advance'}
            className={kind === 'advance' ? styles.activeTab : ''}
            onClick={() => setKind('advance')}
          >
            Lend money
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'repayment'}
            className={kind === 'repayment' ? styles.activeTab : ''}
            disabled={!ledger || ledger.balance <= 0}
            onClick={() => setKind('repayment')}
          >
            Repayment
          </button>
        </div>

        {!ledger && (
          <div className={styles.roleFields}>
            <label className={styles.field}>
              <span>Lender</span>
              <select
                value={lenderAccountId}
                onChange={(event) => handleLenderChange(event.target.value)}
              >
                {mutual.participants.map((participant) => (
                  <option key={participant.accountId} value={participant.accountId}>
                    {accountTitles[participant.accountId] || 'Unknown'}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Borrower</span>
              <select
                value={borrowerAccountId}
                onChange={(event) => handleBorrowerChange(event.target.value)}
              >
                {mutual.participants.map((participant) => (
                  <option key={participant.accountId} value={participant.accountId}>
                    {accountTitles[participant.accountId] || 'Unknown'}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className={styles.entryFields}>
          {movesAssets && (
            <>
              <label className={`${styles.field} ${kind === 'repayment' ? styles.repaymentTarget : ''}`}>
                <span>{kind === 'repayment' ? 'To lender asset' : 'From lender asset'}</span>
                <select
                  value={lenderAssetId}
                  onChange={(event) => {
                    lenderAssetWasSelected.current = true
                    setLenderAssetId(event.target.value)
                  }}
                >
                  {lenderAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} ({formatAmount(asset.amount, asset.currency)})
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${kind === 'repayment' ? styles.repaymentSource : ''}`}>
                <span>{kind === 'repayment' ? 'From borrower asset' : 'To borrower asset'}</span>
                <select
                  value={borrowerAssetId}
                  onChange={(event) => {
                    borrowerAssetWasSelected.current = true
                    setBorrowerAssetId(event.target.value)
                  }}
                >
                  {borrowerAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} ({formatAmount(asset.amount, asset.currency)})
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className={styles.field}>
            <span>Amount</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              max={kind === 'repayment' ? ledger?.balance : undefined}
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Date</span>
            <input
              type="date"
              value={occurredAt}
              max={formatDateForInput(new Date())}
              onClick={(event) => event.currentTarget.showPicker?.()}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>
          <label className={`${styles.field} ${styles.commentField}`}>
            <span>Comment</span>
            <input
              type="text"
              value={comment}
              placeholder="Optional"
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={styles.recordButton}
            disabled={!canSave || isSaving}
            onClick={() => setIsConfirmOpen(true)}
          >
            {isSaving ? 'Recording...' : entryLabels[kind]}
          </button>
        </div>

        {movesAssets && (lenderAssets.length === 0 || borrowerAssets.length === 0) && (
          <p className={styles.warning}>Both accounts need an ILS asset.</p>
        )}
      </div>

      <div className={styles.historySection}>
        <h2>
          Loan history
          <span className={styles.count}>{ledger?.entries.length || 0}</span>
        </h2>
        {!ledger || ledger.entries.length === 0 ? (
          <div className={styles.emptyHistory}>No loan activity recorded.</div>
        ) : (
          <div className={styles.historyList}>
            {ledger.entries.map((entry) => {
              const isRepayment = entry.kind === 'repayment'
              const route = entry.kind === 'opening-balance'
                ? `${entry.borrowerAccountTitle} owes ${entry.lenderAccountTitle}`
                : isRepayment
                ? `${entry.borrowerAccountTitle} → ${entry.lenderAccountTitle}`
                : `${entry.lenderAccountTitle} → ${entry.borrowerAccountTitle}`
              const assetRoute = entry.historical
                ? 'Historical · Assets unchanged'
                : entry.kind === 'opening-balance'
                ? 'No asset movement'
                : isRepayment
                ? `${entry.borrowerAssetTitle} → ${entry.lenderAssetTitle}`
                : `${entry.lenderAssetTitle} → ${entry.borrowerAssetTitle}`

              return (
                <article key={entry.id} className={styles.historyRow}>
                  <div className={styles.historyMain}>
                    <div className={styles.historyTitle}>
                      <strong>{entryLabels[entry.kind]}</strong>
                      <span>{route}</span>
                    </div>
                    <div className={styles.historyMeta}>
                      <span>{formatEntryDate(entry.occurredAt)}</span>
                      <span>{assetRoute}</span>
                      {entry.comment && !entry.historical && <span>{entry.comment}</span>}
                      <span>{entry.createdByName}</span>
                    </div>
                  </div>
                  <div className={styles.historyAmounts}>
                    <strong className={isRepayment ? styles.decrease : styles.increase}>
                      {isRepayment ? '−' : '+'}{formatAmount(entry.amount, entry.currency)}
                    </strong>
                    <span>
                      Balance {formatAmount(balancesByEntry.get(entry.id) || 0, entry.currency)}
                    </span>
                    <button
                      type="button"
                      className={styles.editEntryButton}
                      aria-label={`Edit ${entryLabels[entry.kind]} from ${formatEntryDate(entry.occurredAt)}`}
                      title="Edit date and comment"
                      onClick={() => handleEditEntry(entry)}
                    >
                      ✎
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Record ${entryLabels[kind].toLowerCase()}?`}
        message={confirmationMessage}
        confirmLabel={isSaving ? 'Recording...' : 'Record'}
        variant="info"
        onConfirm={handleConfirm}
        onCancel={() => !isSaving && setIsConfirmOpen(false)}
      />

      <FormDialog
        isOpen={!!editingEntry}
        title="Edit Loan Entry"
        icon="✎"
        submitLabel="Save"
        isLoading={isEditing}
        onSubmit={handleSaveEntryDetails}
        onCancel={() => !isEditing && setEditingEntry(null)}
      >
        <FormField label="Date" required>
          <input
            type="date"
            value={editDate}
            max={formatDateForInput(new Date())}
            onClick={(event) => event.currentTarget.showPicker?.()}
            onChange={(event) => setEditDate(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Comment">
          <input
            type="text"
            value={editComment}
            placeholder="Optional"
            onChange={(event) => setEditComment(event.target.value)}
          />
        </FormField>
      </FormDialog>
    </section>
  )
}
