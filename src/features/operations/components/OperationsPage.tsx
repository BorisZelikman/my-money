import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { OperationsTable } from './OperationsTable'
import { OperationForm, type OperationFormData } from './OperationForm'
import { TotalsSummary } from './TotalsSummary'
import { NavBar } from '@/components/layout/NavBar'
import { ConfirmDialog, DateRangePicker, type DateRange } from '@/components/ui'
import {
  getOperationsByAssetId,
  addOperation,
  updateOperation,
  deleteOperation,
  createTransfer,
  getUniqueCategories,
  calculateTotals,
} from '../services/operationService'
import {
  getAccountById,
  getAccountsWithUsers,
} from '@/features/accounts/services/accountService'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import { getUserPreferences, getAllUsers } from '@/features/profile/services/userService'
import { getMutual } from '@/features/mutuals/services/mutualService'
import { applyLoanEntry, getLoanLedger } from '@/features/mutuals/services/loanService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import type {
  Operation,
  AccountWithUsers,
  Asset,
  MutualPurpose,
  LoanEntry,
  LoanOperationOption,
  MutualParticipant,
} from '@/types'
import styles from './OperationsPage.module.css'

interface AssetOption {
  accountId: string
  accountTitle: string
  asset: Asset
  index?: number
}

function calculateLoanDebtForRange(
  entries: LoanEntry[],
  dateRange: DateRange | null
) {
  const cutoff = dateRange?.to.getTime() ?? Number.POSITIVE_INFINITY
  const isMonthlyRange = !!dateRange &&
    dateRange.from.getDate() === 1 &&
    dateRange.from.getFullYear() === dateRange.to.getFullYear() &&
    dateRange.from.getMonth() === dateRange.to.getMonth()

  if (!isMonthlyRange || !dateRange) {
    return entries.reduce((balanceAtDate, entry) => {
      if (entry.occurredAt.getTime() > cutoff) return balanceAtDate
      return balanceAtDate + (entry.kind === 'repayment' ? -entry.amount : entry.amount)
    }, 0)
  }

  const monthStart = new Date(
    dateRange.from.getFullYear(),
    dateRange.from.getMonth(),
    1
  )
  const nextMonthStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1
  )
  const repaymentWindowEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    10,
    23,
    59,
    59,
    999
  )
  const nextMonthRepaymentWindowEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    10,
    23,
    59,
    59,
    999
  )
  const now = Date.now()
  const latestRepaymentInWindow = (from: number, to: number) => entries.reduce(
    (latest, entry) => entry.kind === 'repayment' &&
      entry.occurredAt.getTime() >= from &&
      entry.occurredAt.getTime() <= to
      ? Math.max(latest, entry.occurredAt.getTime())
      : latest,
    Number.NEGATIVE_INFINITY
  )

  // Salary-period repayments close the previous month's debt cycle.
  const selectedMonthRepayment = latestRepaymentInWindow(
    monthStart.getTime(),
    Math.min(repaymentWindowEnd.getTime(), cutoff, now)
  )
  const followingMonthRepayment = latestRepaymentInWindow(
    nextMonthStart.getTime(),
    Math.min(nextMonthRepaymentWindowEnd.getTime(), now)
  )
  const currentDate = new Date(now)
  const isCurrentCalendarMonth = monthStart.getFullYear() === currentDate.getFullYear() &&
    monthStart.getMonth() === currentDate.getMonth()

  if (!isCurrentCalendarMonth) {
    const previousCycleEnd = Number.isFinite(followingMonthRepayment)
      ? followingMonthRepayment
      : cutoff
    return entries.reduce((balanceAtCycleEnd, entry) => {
      if (entry.occurredAt.getTime() > previousCycleEnd) return balanceAtCycleEnd
      return balanceAtCycleEnd + (
        entry.kind === 'repayment' ? -entry.amount : entry.amount
      )
    }, 0)
  }

  const cycleStart = Number.isFinite(selectedMonthRepayment)
    ? selectedMonthRepayment
    : monthStart.getTime() - 1

  return entries.reduce((monthDebt, entry) => {
    const occurredTime = entry.occurredAt.getTime()
    if (occurredTime <= cycleStart || occurredTime > cutoff) return monthDebt
    return monthDebt + (entry.kind === 'repayment' ? -entry.amount : entry.amount)
  }, 0)
}

export function OperationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [, setAccounts] = useState<AccountWithUsers[]>([])
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null)
  const [operations, setOperations] = useState<Operation[]>([])
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit state
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Date filter state
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // Mutual purposes state
  const [purposes, setPurposes] = useState<MutualPurpose[]>([])
  const [mutualAccountIds, setMutualAccountIds] = useState<Set<string>>(new Set())
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [loanMutuals, setLoanMutuals] = useState<LoanOperationOption[]>([])

  // Load accounts and assets
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setIsLoading(true)
        const prefs = await getUserPreferences(user.uid)
        if (prefs?.accounts && prefs.accounts.length > 0) {
          const accountIds = prefs.accounts.map((a) => a.id)
          const accountsData = await getAccountsWithUsers(accountIds)
          setAccounts(accountsData)
          const allUsers = await getAllUsers()
          const namesMap: Record<string, string> = {}
          for (const accountUser of allUsers) {
            namesMap[accountUser.id] = accountUser.name
          }
          setUserNames(namesMap)

          // Load all assets for all accounts, filtered by user preferences
          const assetPrefs = prefs.assets || []
          const options: AssetOption[] = []
          
          for (const account of accountsData) {
            const assets = await getAssetsByAccountId(account.id)
            for (const asset of assets) {
              // Check if asset should be hidden based on user preferences
              const assetPref = assetPrefs.find((ap) => ap.id === asset.id)
              const isHidden = assetPref?.hide === true
              
              if (!isHidden) {
                options.push({
                  accountId: account.id,
                  accountTitle: account.title,
                  asset,
                  index: assetPref?.index ?? 999,
                })
              }
            }
          }
          
          // Sort by index from user preferences
          options.sort((a, b) => (a.index ?? 999) - (b.index ?? 999))
          setAssetOptions(options)

          // Auto-select first asset
          if (options.length > 0) {
            setSelectedAsset(options[0])
          }

          // Load mutuals to get purposes and loan relationships.
          if (prefs.mutuals && prefs.mutuals.length > 0) {
            const mutualAccIds = new Set<string>()
            let allPurposes: MutualPurpose[] = []
            const loanOptions: LoanOperationOption[] = []
            const accountCache = new Map(accountsData.map((account) => [account.id, account]))

            const getAccount = async (accountId: string) => {
              const cached = accountCache.get(accountId)
              if (cached) return cached

              const account = await getAccountById(accountId)
              if (account) accountCache.set(accountId, { ...account, userNames: [] })
              return account
            }

            const getParticipantAsset = async (
              participant: MutualParticipant | undefined,
              preferredAssetId?: string | null,
              assetAccountId?: string | null
            ) => {
              if (!participant) return null
              const assets = await getAssetsByAccountId(
                assetAccountId || participant.accountId
              )
              return assets.find((asset) => asset.id === preferredAssetId) ||
                assets.find((asset) => asset.id === participant.defaultAssetId) ||
                assets.find((asset) => asset.currency === 'ILS') ||
                assets[0] ||
                null
            }

            for (const mutualId of prefs.mutuals) {
              const mutual = await getMutual(mutualId)
              if (mutual) {
                // Track which accounts are in mutuals
                for (const p of mutual.participants) {
                  mutualAccIds.add(p.accountId)
                }
                // Collect purposes (filter out settlement purposes)
                allPurposes = [...allPurposes, ...mutual.purposes.filter(p => !p.isSettlement)]

                const isLoan = mutual.type === 'loan' ||
                  mutual.title.trim().toLowerCase() === 'loans'
                if (isLoan && mutual.participants.length > 0) {
                  const ledger = await getLoanLedger(mutual.id)
                  const lenderAccountId = mutual.lenderAccountId ||
                    mutual.participants.find((participant) =>
                      participant.accountId === ledger?.lenderAccountId
                    )?.accountId ||
                    mutual.participants.find((participant) =>
                      participant.userId === mutual.createdBy
                    )?.accountId ||
                    mutual.participants[0].accountId
                  const lenderParticipant = mutual.participants.find(
                    (participant) => participant.accountId === lenderAccountId
                  ) || mutual.participants[0]
                  const borrowerParticipant = mutual.participants.find(
                    (participant) => participant.accountId !== lenderParticipant.accountId
                  )
                  const latestEntry = ledger?.entries[0]
                  const [lenderAccount, borrowerAccount, lenderAsset, borrowerAsset] =
                    await Promise.all([
                      getAccount(lenderParticipant.accountId),
                      borrowerParticipant ? getAccount(borrowerParticipant.accountId) : null,
                      getParticipantAsset(
                        lenderParticipant,
                        latestEntry?.lenderAssetId,
                        latestEntry?.lenderAssetAccountId
                      ),
                      getParticipantAsset(
                        borrowerParticipant,
                        latestEntry?.borrowerAssetId,
                        latestEntry?.borrowerAssetAccountId
                      ),
                    ])
                  const memberUserIds = Array.from(new Set([
                    ...(mutual.memberUserIds || []),
                    ...mutual.participants.flatMap((participant) =>
                      participant.userId ? [participant.userId] : []
                    ),
                    ...(lenderAccount?.users || []),
                    ...(borrowerAccount?.users || []),
                  ]))
                  const viewerRole = mutual.createdBy === user.uid ||
                    lenderParticipant.userId === user.uid ||
                    lenderAccount?.users.includes(user.uid)
                    ? 'lender'
                    : 'borrower'

                  loanOptions.push({
                    mutualId: mutual.id,
                    mutualTitle: mutual.title,
                    lenderPartyId: ledger?.lenderAccountId || lenderParticipant.accountId,
                    lenderTitle: ledger?.lenderAccountTitle ||
                      namesMap[lenderParticipant.userId || ''] ||
                      lenderAccount?.title ||
                      'Lender',
                    lenderAccountId: lenderParticipant.accountId,
                    lenderAssetAccountId: latestEntry?.lenderAssetAccountId ||
                      lenderParticipant.accountId,
                    lenderAsset,
                    borrowerPartyId: ledger?.borrowerAccountId || `external:${mutual.id}`,
                    borrowerTitle: mutual.counterpartyName ||
                      ledger?.borrowerAccountTitle ||
                      namesMap[borrowerParticipant?.userId || ''] ||
                      borrowerAccount?.title ||
                      mutual.pendingInviteEmails?.[0]?.split('@')[0] ||
                      'Borrower',
                    borrowerAccountId: borrowerParticipant?.accountId || null,
                    borrowerAssetAccountId: latestEntry?.borrowerAssetAccountId ||
                      borrowerParticipant?.accountId ||
                      null,
                    borrowerAsset,
                    memberUserIds,
                    viewerRole,
                    ledgerBalance: ledger?.balance || 0,
                    ledgerEntries: ledger?.entries || [],
                  })
                }
              }
            }
            setMutualAccountIds(mutualAccIds)
            setPurposes(allPurposes)
            setLoanMutuals(loanOptions)
          } else {
            setMutualAccountIds(new Set())
            setPurposes([])
            setLoanMutuals([])
          }
        }
      } catch (error) {
        logger.error('Error loading data', error)
        toast.error('Failed to load data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Load operations when asset changes
  const loadOperations = useCallback(async () => {
    if (!selectedAsset) return

    try {
      const ops = await getOperationsByAssetId(
        selectedAsset.accountId,
        selectedAsset.asset.id
      )
      setOperations(ops.filter((operation) => !operation.settlementId))

      const cats = await getUniqueCategories(
        selectedAsset.accountId,
        selectedAsset.asset.id
      )
      setCategories(cats)
    } catch (error) {
      logger.error('Error loading operations', error)
    }
  }, [selectedAsset])

  useEffect(() => {
    loadOperations()
  }, [loadOperations])

  // Filter operations by date range
  useEffect(() => {
    if (!dateRange) {
      setFilteredOperations(operations)
    } else {
      const filtered = operations.filter((op) => {
        const opDate = op.datetime.toDate()
        return opDate >= dateRange.from && opDate <= dateRange.to
      })
      setFilteredOperations(filtered)
    }
  }, [operations, dateRange])

  // Clear selection when asset changes
  useEffect(() => {
    setSelectedOperation(null)
  }, [selectedAsset])

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10)
    setSelectedAsset(assetOptions[index] || null)
  }

  const handleOperationSelect = (operation: Operation) => {
    if (operation.loanEntryId) {
      toast.info('Loan entries are managed by the loan ledger and cannot be edited.')
      return
    }

    if (selectedOperation?.id === operation.id) {
      setSelectedOperation(null)
    } else {
      setSelectedOperation(operation)
    }
  }

  const handleCancelEdit = () => {
    setSelectedOperation(null)
  }

  const handleSubmit = async (data: OperationFormData) => {
    if (!selectedAsset || !user) return

    try {
      setIsSubmitting(true)

      if (data.type === 'lend' || data.type === 'repay') {
        if (!data.loanMutualId) {
          throw new Error('Select a loan relationship.')
        }
        const loan = loanMutuals.find((option) => option.mutualId === data.loanMutualId)
        if (!loan) throw new Error('The selected loan relationship is unavailable.')

        const selectedIsLender = loan.viewerRole === 'lender'
        const selectedIsBorrower = loan.viewerRole === 'borrower'

        const lenderAsset = selectedIsLender ? selectedAsset.asset : loan.lenderAsset
        const borrowerAsset = selectedIsBorrower ? selectedAsset.asset : loan.borrowerAsset
        const currency = selectedAsset.asset.currency
        if (
          (lenderAsset && lenderAsset.currency !== currency) ||
          (borrowerAsset && borrowerAsset.currency !== currency)
        ) {
          throw new Error(`Both linked loan assets must use ${currency}.`)
        }

        const appliedEntry = await applyLoanEntry(loan.mutualId, {
          kind: data.type === 'lend' ? 'advance' : 'repayment',
          lenderAccountId: loan.lenderPartyId,
          lenderAccountTitle: loan.lenderTitle,
          lenderAssetAccountId: selectedIsLender
            ? selectedAsset.accountId
            : loan.lenderAssetAccountId || loan.lenderAccountId,
          lenderAssetId: lenderAsset?.id || null,
          lenderAssetTitle: lenderAsset?.title || null,
          borrowerAccountId: loan.borrowerPartyId,
          borrowerAccountTitle: loan.borrowerTitle,
          borrowerAssetAccountId: selectedIsBorrower
            ? selectedAsset.accountId
            : loan.borrowerAssetAccountId || loan.borrowerAccountId,
          borrowerAssetId: borrowerAsset?.id || null,
          borrowerAssetTitle: borrowerAsset?.title || null,
          amount: data.amount,
          currency,
          occurredAt: data.datetime,
          createdBy: user.uid,
          createdByName: user.displayName || user.email || 'User',
          memberUserIds: loan.memberUserIds,
          comment: data.comment,
        })
        setLoanMutuals((currentLoans) => currentLoans.map((currentLoan) => {
          if (currentLoan.mutualId !== loan.mutualId) return currentLoan

          const ledgerEntries = [appliedEntry, ...currentLoan.ledgerEntries].sort(
            (first, second) => second.occurredAt.getTime() - first.occurredAt.getTime()
          )
          const balanceChange = appliedEntry.kind === 'repayment'
            ? -appliedEntry.amount
            : appliedEntry.amount
          return {
            ...currentLoan,
            ledgerBalance: Math.round(
              (currentLoan.ledgerBalance + balanceChange) * 100
            ) / 100,
            ledgerEntries,
          }
        }))
        setSuccessMessage(
          data.type === 'lend'
            ? `Loan of ${data.amount} ${currency} recorded.`
            : `Repayment of ${data.amount} ${currency} recorded.`
        )
      } else if (data.type === 'transfer' && data.targetAccountId && data.targetAssetId) {
        // Handle transfer
        await createTransfer(selectedAsset.accountId, selectedAsset.asset.id, {
          userId: user.uid,
          title: data.title,
          amount: data.amount,
          comment: data.comment,
          datetime: data.datetime,
          rate: data.rate || 1,
          targetAccountId: data.targetAccountId,
          targetAssetId: data.targetAssetId,
        })
        setSuccessMessage(`Transfer of ${data.amount} completed!`)
      } else if (selectedOperation) {
        // Update existing operation
        await updateOperation(
          selectedAsset.accountId,
          selectedAsset.asset.id,
          selectedOperation.id,
          selectedOperation,
          {
            type: data.type,
            title: data.title,
            amount: data.amount,
            category: data.category,
            comment: data.comment,
            datetime: data.datetime,
            userId: user.uid,
            purposeId: data.purposeId,
          }
        )
        setSuccessMessage('Operation updated successfully!')
        setSelectedOperation(null)
      } else {
        // Add new operation
        await addOperation(selectedAsset.accountId, selectedAsset.asset.id, {
          type: data.type,
          title: data.title,
          amount: data.amount,
          category: data.category,
          comment: data.comment,
          datetime: data.datetime,
          userId: user.uid,
          purposeId: data.purposeId,
        })
        setSuccessMessage(
          data.type === 'payment'
            ? `Payment of ${data.amount} added!`
            : `Income of ${data.amount} added!`
        )
      }

      setTimeout(() => setSuccessMessage(null), 3000)
      await loadOperations()
    } catch (error) {
      logger.error('Error saving operation', error)
      toast.error('Failed to save operation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAsset || !selectedOperation) return

    try {
      setIsSubmitting(true)
      await deleteOperation(
        selectedAsset.accountId,
        selectedAsset.asset.id,
        selectedOperation
      )
      setSuccessMessage('Operation deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      setSelectedOperation(null)
      setShowDeleteConfirm(false)
      await loadOperations()
    } catch (error) {
      logger.error('Error deleting operation', error)
      toast.error('Failed to delete operation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  // Calculate totals for filtered operations
  const totals = calculateTotals(filteredOperations)
  const selectedLoanDebt = useMemo(() => {
    if (!selectedAsset) return null

    for (const loan of loanMutuals) {
      const isLenderAsset = loan.lenderAssetAccountId === selectedAsset.accountId &&
        loan.lenderAsset?.id === selectedAsset.asset.id
      const isBorrowerAsset = loan.borrowerAssetAccountId === selectedAsset.accountId &&
        loan.borrowerAsset?.id === selectedAsset.asset.id
      if (!isLenderAsset && !isBorrowerAsset) continue

      const amount = calculateLoanDebtForRange(loan.ledgerEntries, dateRange)

      return {
        label: 'Owes' as const,
        amount: Math.max(0, Math.round(amount * 100) / 100),
      }
    }

    return null
  }, [dateRange, loanMutuals, selectedAsset])

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className={styles.container}>
      <NavBar />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Operations</h1>
          <p className={styles.subtitle}>Track your payments, income, and transfers</p>
        </header>

        {isLoading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading your assets...</p>
          </div>
        ) : assetOptions.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <h3>No assets found</h3>
            <p>You need to have at least one asset to record operations.</p>
          </div>
        ) : (
          <>
            <div className={styles.assetSelector}>
              <label htmlFor="asset-select">Select Asset</label>
              <select
                id="asset-select"
                value={assetOptions.findIndex(
                  (o) =>
                    o.accountId === selectedAsset?.accountId &&
                    o.asset.id === selectedAsset?.asset.id
                )}
                onChange={handleAssetChange}
              >
                {assetOptions.map((option, index) => (
                  <option key={`${option.accountId}-${option.asset.id}`} value={index}>
                    {option.accountTitle} → {option.asset.title} ({option.asset.currency})
                  </option>
                ))}
              </select>
            </div>

            {successMessage && (
              <div className={styles.successMessage}>
                <span>✅</span> {successMessage}
              </div>
            )}

            <div className={styles.filterSection}>
              <h2>Filter by Date</h2>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <TotalsSummary
              income={totals.income}
              expenses={totals.expenses}
              transfers={totals.transfers}
              balance={totals.balance}
              currency={selectedAsset?.asset.currency || 'ILS'}
              loanDebt={selectedLoanDebt}
            />

            <div className={styles.content}>
              <div className={styles.formSection}>
                <h2>{selectedOperation ? 'Edit Operation' : 'Add Operation'}</h2>
                {selectedOperation && (
                  <p className={styles.editHint}>Editing: {selectedOperation.title}</p>
                )}
                <OperationForm
                  onSubmit={handleSubmit}
                  onDelete={handleDeleteClick}
                  categories={categories}
                  editOperation={selectedOperation}
                  onCancelEdit={handleCancelEdit}
                  isSubmitting={isSubmitting}
                  currentAsset={selectedAsset}
                  availableAssets={assetOptions}
                  purposes={selectedAsset && mutualAccountIds.has(selectedAsset.accountId) ? purposes : []}
                  loanMutuals={loanMutuals}
                />
              </div>

              <div className={styles.tableSection}>
                <h2>
                  History
                  <span className={styles.badge}>{filteredOperations.length}</span>
                </h2>
                <p className={styles.tableHint}>Click a row to edit or delete</p>
                <OperationsTable
                  operations={filteredOperations}
                  currency={selectedAsset?.asset.currency || 'ILS'}
                  selectedId={selectedOperation?.id}
                  onSelect={handleOperationSelect}
                  purposes={purposes}
                  userNames={userNames}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Operation"
        message={`Are you sure you want to delete "${selectedOperation?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
