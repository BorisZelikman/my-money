import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import {
  OperationsTable,
  type OperationHistoryItem,
} from './OperationsTable'
import { OperationForm, type OperationFormData } from './OperationForm'
import { TotalsSummary } from './TotalsSummary'
import { NavBar } from '@/components/layout/NavBar'
import { ConfirmDialog, DateRangePicker, type DateRange } from '@/components/ui'
import {
  getOperationsByAssetId,
  getOperationsByDateRange,
  addOperation,
  updateOperation,
  deleteOperation,
  createTransfer,
  calculateTotals,
} from '../services/operationService'
import {
  getAccountById,
  getAccountsByIds,
} from '@/features/accounts/services/accountService'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import { getUserPreferences, getUsersByIds } from '@/features/profile/services/userService'
import { getMutual } from '@/features/mutuals/services/mutualService'
import { applyLoanEntry, getLoanLedger } from '@/features/mutuals/services/loanService'
import {
  getOperationTemplates,
  initializeOperationTemplates,
  safelyRecordOperationTemplate,
} from '../services/operationTemplateService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import type {
  Account,
  Asset,
  MutualPurpose,
  LoanEntry,
  LoanOperationOption,
  MutualParticipant,
  OperationTemplate,
} from '@/types'
import styles from './OperationsPage.module.css'

interface AssetOption {
  accountId: string
  accountTitle: string
  asset: Asset
  index?: number
}

function getCurrentMonthRange(): DateRange {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  }
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

interface OperationsPageProps {
  compact?: boolean
}

export function OperationsPage({ compact = false }: OperationsPageProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null)
  const [operations, setOperations] = useState<OperationHistoryItem[]>([])
  const [filteredOperations, setFilteredOperations] = useState<OperationHistoryItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit state
  const [selectedOperation, setSelectedOperation] = useState<OperationHistoryItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Date filter state
  const [dateRange, setDateRange] = useState<DateRange | null>(getCurrentMonthRange)
  const operationsRequestId = useRef(0)

  // Mutual purposes state
  const [purposes, setPurposes] = useState<MutualPurpose[]>([])
  const [mutualAccountIds, setMutualAccountIds] = useState<Set<string>>(new Set())
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [loanMutuals, setLoanMutuals] = useState<LoanOperationOption[]>([])
  const [operationTemplates, setOperationTemplates] = useState<OperationTemplate[]>([])

  // Load accounts and assets
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (!user) return

      try {
        setIsLoading(true)
        const prefs = await getUserPreferences(user.uid)
        if (!prefs?.accounts?.length) {
          if (!cancelled) {
            setAssetOptions([])
            setSelectedAsset(null)
          }
          return
        }

        const preferences = prefs
        const currentUser = user
        const accountIds = preferences.accounts.map((account) => account.id)
        const [accountsData, accountAssetLists] = await Promise.all([
          getAccountsByIds(accountIds),
          Promise.all(accountIds.map((accountId) => getAssetsByAccountId(accountId))),
        ])
        if (cancelled) return

        const accountById = new Map(accountsData.map((account) => [account.id, account]))
        const namesMap: Record<string, string> = {
          [currentUser.uid]: preferences.name,
        }

        const assetPrefs = preferences.assets || []
        const options = accountIds.flatMap((accountId, accountIndex) => {
          const account = accountById.get(accountId)
          if (!account) return []

          return accountAssetLists[accountIndex].flatMap((asset) => {
            const assetPref = assetPrefs.find((preference) => preference.id === asset.id)
            if (assetPref?.hide) return []

            return [{
              accountId,
              accountTitle: account.title,
              asset,
              index: assetPref?.index ?? 999,
            } satisfies AssetOption]
          })
        }).sort((first, second) => (first.index ?? 999) - (second.index ?? 999))

        setUserNames(namesMap)
        setAssetOptions(options)
        setSelectedAsset(options[0] || null)
        setMutualAccountIds(new Set())
        setPurposes([])
        setLoanMutuals([])
        setIsLoading(false)

        async function loadMutualData() {
          if (!preferences.mutuals?.length) return

          const mutuals = (await Promise.all(preferences.mutuals.map(getMutual)))
            .filter((mutual) => mutual !== null)
          if (cancelled) return

          const mutualAccIds = new Set<string>()
          const allPurposes: MutualPurpose[] = []
          const accountCache = new Map<string, Account>(
            accountsData.map((account) => [account.id, account])
          )
          const accountRequests = new Map<string, Promise<Account | null>>()
          const assetRequests = new Map<string, Promise<Asset[]>>(
            accountIds.map((accountId, index) => [
              accountId,
              Promise.resolve(accountAssetLists[index]),
            ])
          )

          const getAccount = (accountId: string) => {
            const cached = accountCache.get(accountId)
            if (cached) return Promise.resolve(cached)

            let request = accountRequests.get(accountId)
            if (!request) {
              request = getAccountById(accountId)
              accountRequests.set(accountId, request)
            }
            return request
          }

          const getAssets = (accountId: string) => {
            let request = assetRequests.get(accountId)
            if (!request) {
              request = getAssetsByAccountId(accountId)
              assetRequests.set(accountId, request)
            }
            return request
          }

          const getParticipantAsset = async (
            participant: MutualParticipant | undefined,
            preferredAssetId?: string | null,
            assetAccountId?: string | null
          ) => {
            if (!participant) return null
            const assets = await getAssets(assetAccountId || participant.accountId)
            return assets.find((asset) => asset.id === preferredAssetId) ||
              assets.find((asset) => asset.id === participant.defaultAssetId) ||
              assets.find((asset) => asset.currency === 'ILS') ||
              assets[0] ||
              null
          }

          for (const mutual of mutuals) {
            for (const participant of mutual.participants) {
              mutualAccIds.add(participant.accountId)
            }
            allPurposes.push(...mutual.purposes.filter((purpose) => !purpose.isSettlement))
          }

          const loanResults: Array<LoanOperationOption | null> = await Promise.all(
            mutuals.map(async (mutual): Promise<LoanOperationOption | null> => {
              const isLoan = mutual.type === 'loan' ||
                mutual.title.trim().toLowerCase() === 'loans'
              if (!isLoan || mutual.participants.length === 0) return null

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
              const viewerRole = mutual.createdBy === currentUser.uid ||
                lenderParticipant.userId === currentUser.uid ||
                lenderAccount?.users.includes(currentUser.uid)
                ? 'lender'
                : 'borrower'

              return {
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
              }
            })
          )
          const loanOptions = loanResults.filter(
            (loan): loan is LoanOperationOption => loan !== null
          )

          if (cancelled) return
          setMutualAccountIds(mutualAccIds)
          setPurposes(allPurposes)
          setLoanMutuals(loanOptions)
        }

        void loadMutualData().catch((error) => {
          logger.error('Error loading shared operation data', error)
          if (!cancelled) {
            toast.error('Shared and loan options could not be loaded.')
          }
        })
      } catch (error) {
        logger.error('Error loading data', error)
        if (!cancelled) {
          toast.error('Failed to load data. Please try again.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }

    return () => {
      cancelled = true
    }
  }, [user])

  // Suggestions are loaded independently so they never delay the main page.
  useEffect(() => {
    if (!user || assetOptions.length === 0) {
      setOperationTemplates([])
      return
    }

    const currentUser = user
    let cancelled = false
    async function loadTemplates() {
      try {
        const existing = await getOperationTemplates(currentUser.uid)
        if (!cancelled) setOperationTemplates(existing)

        const initialized = await initializeOperationTemplates(
          currentUser.uid,
          assetOptions.map((option) => ({
            accountId: option.accountId,
            assetId: option.asset.id,
          }))
        )
        if (initialized && !cancelled) {
          setOperationTemplates(await getOperationTemplates(currentUser.uid))
        }
      } catch (error) {
        logger.warn('Could not load operation suggestions.', error)
      }
    }

    void loadTemplates()
    return () => {
      cancelled = true
    }
  }, [assetOptions, user])

  // Load the selected date range across every visible asset.
  const loadOperations = useCallback(async () => {
    if (assetOptions.length === 0) return

    const requestId = ++operationsRequestId.current
    try {
      setIsHistoryLoading(true)
      setOperations([])
      const operationGroups = await Promise.all(assetOptions.map(async (option) => {
        const assetOperations = dateRange
          ? await getOperationsByDateRange(
              option.accountId,
              option.asset.id,
              dateRange
            )
          : await getOperationsByAssetId(option.accountId, option.asset.id)

        return assetOperations
          .filter((operation) => !operation.settlementId)
          .map((operation): OperationHistoryItem => ({
            ...operation,
            historyKey: `${option.accountId}:${option.asset.id}:${operation.id}`,
            assetAccountId: option.accountId,
            assetAccountTitle: option.accountTitle,
            assetId: option.asset.id,
            assetTitle: option.asset.title,
            assetCurrency: option.asset.currency,
          }))
      }))
      if (requestId !== operationsRequestId.current) return

      const visibleOperations = operationGroups.flat().sort(
        (first, second) => second.datetime.toDate().getTime() - first.datetime.toDate().getTime()
      )
      setOperations(visibleOperations)
      setCategories(
        Array.from(new Set(visibleOperations.map((operation) => operation.category).filter(Boolean)))
          .sort()
      )

      const operationUserIds = Array.from(new Set(
        visibleOperations.map((operation) => operation.userId).filter(Boolean)
      ))
      if (operationUserIds.length > 0) {
        void getUsersByIds(operationUserIds).then((users) => {
          setUserNames((currentNames) => ({
            ...currentNames,
            ...Object.fromEntries(users.map((operationUser) => [
              operationUser.id,
              operationUser.name,
            ])),
          }))
        }).catch((error) => {
          logger.warn('Error loading operation user names', error)
        })
      }
    } catch (error) {
      if (requestId !== operationsRequestId.current) return
      logger.error('Error loading operations', error)
      toast.error('Failed to load operation history.')
    } finally {
      if (requestId === operationsRequestId.current) {
        setIsHistoryLoading(false)
      }
    }
  }, [assetOptions, dateRange])

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

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10)
    setSelectedAsset(assetOptions[index] || null)
    setSelectedOperation(null)
  }

  const handleAssetIndexChange = (index: number) => {
    setSelectedAsset(assetOptions[index] || null)
    setSelectedOperation(null)
  }

  const handleOperationSelect = (operation: OperationHistoryItem) => {
    if (operation.loanEntryId) {
      toast.info('Loan entries are managed by the loan ledger and cannot be edited.')
      return
    }

    if (selectedOperation?.historyKey === operation.historyKey) {
      setSelectedOperation(null)
    } else {
      const sourceAsset = assetOptions.find(
        (option) => option.accountId === operation.assetAccountId &&
          option.asset.id === operation.assetId
      )
      if (sourceAsset) setSelectedAsset(sourceAsset)
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
          selectedOperation.assetAccountId,
          selectedOperation.assetId,
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
        if (data.type === 'payment' || data.type === 'income') {
          await safelyRecordOperationTemplate(user.uid, {
            type: data.type,
            title: data.title,
            amount: data.amount,
            category: data.category,
            datetime: data.datetime,
            accountId: selectedAsset.accountId,
            assetId: selectedAsset.asset.id,
            purposeId: data.purposeId,
          })
          try {
            setOperationTemplates(await getOperationTemplates(user.uid))
          } catch (error) {
            logger.warn('Could not refresh operation suggestions.', error)
          }
        }
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
        selectedOperation.assetAccountId,
        selectedOperation.assetId,
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
    <div className={`${styles.container} ${compact ? styles.compactContainer : ''}`}>
      <NavBar />

      <main className={`${styles.main} ${compact ? styles.compactMain : ''}`}>
        {!compact && (
          <header className={styles.header}>
            <h1>Operations</h1>
            <p className={styles.subtitle}>Track your payments, income, and transfers</p>
          </header>
        )}

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
            {!compact && assetOptions.length > 1 && <div className={styles.assetSelector}>
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
            </div>}

            {successMessage && (
              <div className={styles.successMessage}>
                <span>✅</span> {successMessage}
              </div>
            )}

            {!compact && (
              <>
                <div className={styles.filterSection}>
                  <h2>Filter by Date</h2>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>

                <TotalsSummary
                  income={totals.income}
                  expenses={totals.expenses}
                  transfers={totals.transfers}
                  balance={totals.balance}
                  currency={selectedAsset?.asset.currency || 'ILS'}
                  loanDebt={selectedLoanDebt}
                />
              </>
            )}

            <div className={`${styles.content} ${compact ? styles.compactContent : ''}`}>
              <div className={`${styles.formSection} ${compact ? styles.compactFormSection : ''}`}>
                <h2 className={styles.formTitle}>
                  {selectedOperation ? (
                    <>
                      <span className={styles.editingLabel}>Editing:</span>
                      <span
                        className={styles.editingTitle}
                        title={selectedOperation.title}
                      >
                        {selectedOperation.title}
                      </span>
                    </>
                  ) : 'Add Operation'}
                </h2>
                <OperationForm
                  onSubmit={handleSubmit}
                  onDelete={handleDeleteClick}
                  categories={categories}
                  editOperation={selectedOperation}
                  onCancelEdit={handleCancelEdit}
                  isSubmitting={isSubmitting}
                  currentAsset={selectedAsset}
                  availableAssets={assetOptions}
                  onAssetChange={handleAssetIndexChange}
                  purposes={selectedAsset && mutualAccountIds.has(selectedAsset.accountId) ? purposes : []}
                  loanMutuals={loanMutuals}
                  operationTemplates={operationTemplates}
                  compact={compact}
                />
              </div>

              <div className={`${styles.tableSection} ${compact ? styles.compactTableSection : ''}`}>
                {compact ? (
                  <div className={styles.compactHistoryToolbar}>
                    <h2>
                      History
                      <span className={styles.badge}>
                        {isHistoryLoading ? '...' : filteredOperations.length}
                      </span>
                    </h2>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      compact
                    />
                    <TotalsSummary
                      income={totals.income}
                      expenses={totals.expenses}
                      transfers={totals.transfers}
                      balance={totals.balance}
                      currency={selectedAsset?.asset.currency || 'ILS'}
                      loanDebt={selectedLoanDebt}
                      compact
                      inline
                    />
                  </div>
                ) : (
                  <h2>
                    History
                    <span className={styles.badge}>
                      {isHistoryLoading ? '...' : filteredOperations.length}
                    </span>
                  </h2>
                )}
                {!compact && <p className={styles.tableHint}>Click a row to edit or delete</p>}
                <div className={compact ? styles.historyScroll : ''}>
                  {isHistoryLoading ? (
                    <div className={styles.historyLoader} role="status">
                      <div className={styles.historySpinner} />
                      <span>Loading history...</span>
                    </div>
                  ) : (
                    <OperationsTable
                      operations={filteredOperations}
                      currency={selectedAsset?.asset.currency || 'ILS'}
                      selectedKey={selectedOperation?.historyKey}
                      onSelect={handleOperationSelect}
                      purposes={purposes}
                      userNames={userNames}
                    />
                  )}
                </div>
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
