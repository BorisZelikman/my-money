import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/features/auth'
import {
  OperationsTable,
  type OperationHistoryItem,
} from './OperationsTable'
import {
  OperationForm,
  type OperationContextSummary,
  type OperationFormData,
} from './OperationForm'
import { TotalsSummary } from './TotalsSummary'
import { NavBar } from '@/components/layout/NavBar'
import { ConfirmDialog, DateRangePicker, type DateRange } from '@/components/ui'
import {
  getOperationsByAssetId,
  getOperationById,
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
import { createCategory as createAccountCategory, getCategories } from '@/features/categories'
import { getUserPreferences, getUsersByIds } from '@/features/profile/services/userService'
import {
  getMutual,
  getMutualOperations,
} from '@/features/mutuals/services/mutualService'
import { applyLoanEntry, getLoanLedger } from '@/features/mutuals/services/loanService'
import {
  getOperationTemplates,
  initializeOperationTemplates,
  safelyRecordOperationTemplate,
} from '../services/operationTemplateService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import { LoaderCircle, SlidersHorizontal, Users } from 'lucide-react'
import type {
  Account,
  Asset,
  MutualPurpose,
  LoanEntry,
  LoanOperationOption,
  MutualParticipant,
  OperationTemplate,
  Category,
  CategoryInput,
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

interface OperationFormPreferences {
  simpleMode: boolean
  defaultAssetId?: string
  defaultOperationType?: 'payment' | 'income'
  defaultPurposeId?: string
}

export function OperationsPage({ compact = false }: OperationsPageProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null)
  const [operations, setOperations] = useState<OperationHistoryItem[]>([])
  const [filteredOperations, setFilteredOperations] = useState<OperationHistoryItem[]>([])
  const [categoryDefinitions, setCategoryDefinitions] = useState<Category[]>([])
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
  const [mutualIds, setMutualIds] = useState<string[]>([])
  const [mutualAccountIds, setMutualAccountIds] = useState<Set<string>>(new Set())
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [showMutualOperations, setShowMutualOperations] = useState(false)
  const [mutualOperations, setMutualOperations] = useState<OperationHistoryItem[]>([])
  const [isMutualHistoryLoading, setIsMutualHistoryLoading] = useState(false)
  const mutualOperationsRequestId = useRef(0)
  const mutualOperationsCache = useRef(new Map<string, OperationHistoryItem[]>())
  const [loanMutuals, setLoanMutuals] = useState<LoanOperationOption[]>([])
  const [operationTemplates, setOperationTemplates] = useState<OperationTemplate[]>([])
  const [formPreferences, setFormPreferences] = useState<OperationFormPreferences>({
    simpleMode: false,
  })
  const [operationContext, setOperationContext] = useState<OperationContextSummary | null>(null)
  const [advancedContextVisible, setAdvancedContextVisible] = useState(false)
  const selectedCategoryDefinitions = useMemo(
    () => categoryDefinitions.filter((category) =>
      category.accountId === selectedAsset?.accountId
    ),
    [categoryDefinitions, selectedAsset?.accountId]
  )
  const categorySuggestions = useMemo(
    () => Array.from(new Set(
      operations
        .filter((operation) => operation.assetAccountId === selectedAsset?.accountId)
        .map((operation) => operation.category)
        .filter(Boolean)
    )).sort(),
    [operations, selectedAsset?.accountId]
  )

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
        setMutualIds(preferences.mutuals || [])
        setFormPreferences({
          simpleMode: preferences.simpleOperationForm || false,
          defaultAssetId: preferences.defaultAssetId || undefined,
          defaultOperationType: preferences.defaultOperationType === 'income'
            ? 'income'
            : preferences.defaultOperationType === 'payment'
              ? 'payment'
              : undefined,
          defaultPurposeId: preferences.defaultPurposeId || undefined,
        })
        const accountIds = preferences.accounts.map((account) => account.id)
        const [accountsData, accountAssetLists, storedCategoryLists] = await Promise.all([
          getAccountsByIds(accountIds),
          Promise.all(accountIds.map((accountId) => getAssetsByAccountId(accountId))),
          Promise.all(accountIds.map((accountId) => getCategories(accountId).catch((error) => {
            logger.warn(`Could not load category hierarchy for account ${accountId}.`, error)
            return []
          }))),
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
        setCategoryDefinitions(storedCategoryLists.flat())
        setAssetOptions(options)
        setSelectedAsset(
          options.find((option) => option.asset.id === preferences.defaultAssetId) ||
          options[0] ||
          null
        )
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

  useEffect(() => {
    const accountId = searchParams.get('accountId')
    const assetId = searchParams.get('assetId')
    const operationId = searchParams.get('operationId')
    if (!user || !accountId || !assetId || !operationId || assetOptions.length === 0) return

    const sourceAsset = assetOptions.find(
      (option) => option.accountId === accountId && option.asset.id === assetId
    )
    if (!sourceAsset) {
      toast.info('This mutual participant operation is read-only.')
      setSearchParams({}, { replace: true })
      return
    }
    const linkedAccountId = accountId
    const linkedAssetId = assetId
    const linkedOperationId = operationId
    const linkedAsset = sourceAsset

    let cancelled = false
    async function openLinkedOperation() {
      try {
        const operation = await getOperationById(
          linkedAccountId,
          linkedAssetId,
          linkedOperationId
        )
        if (cancelled) return
        if (!operation) {
          toast.error('The selected operation no longer exists.')
          return
        }
        const operationDate = operation.datetime.toDate()
        const now = new Date()
        setDateRange({
          from: new Date(operationDate.getFullYear(), operationDate.getMonth(), 1),
          to: operationDate.getFullYear() === now.getFullYear() &&
            operationDate.getMonth() === now.getMonth()
            ? now
            : new Date(operationDate.getFullYear(), operationDate.getMonth() + 1, 0, 23, 59, 59, 999),
        })
        setSelectedAsset(linkedAsset)
        setSelectedOperation({
          ...operation,
          historyKey: `${linkedAccountId}:${linkedAssetId}:${operation.id}`,
          assetAccountId: linkedAccountId,
          assetAccountTitle: linkedAsset.accountTitle,
          assetId: linkedAssetId,
          assetTitle: linkedAsset.asset.title,
          assetCurrency: linkedAsset.asset.currency,
        })
        setAdvancedContextVisible(false)
      } catch (error) {
        logger.error('Could not open linked operation', error)
        toast.error('The selected operation could not be opened.')
      } finally {
        if (!cancelled) setSearchParams({}, { replace: true })
      }
    }

    void openLinkedOperation()
    return () => { cancelled = true }
  }, [assetOptions, searchParams, setSearchParams, user])

  useEffect(() => {
    if (!showMutualOperations || !user || mutualIds.length === 0) {
      setIsMutualHistoryLoading(false)
      return
    }

    const requestId = ++mutualOperationsRequestId.current
    const currentUserId = user.uid
    const cacheKey = [
      currentUserId,
      [...mutualIds].sort().join(','),
      dateRange?.from.toISOString() || 'first',
      dateRange?.to.toISOString() || 'last',
    ].join('|')
    const cachedOperations = mutualOperationsCache.current.get(cacheKey)
    if (cachedOperations) {
      setMutualOperations(cachedOperations)
      setIsMutualHistoryLoading(false)
      return
    }
    setMutualOperations([])
    let cancelled = false

    async function loadMutualParticipantOperations() {
      try {
        setIsMutualHistoryLoading(true)
        const mutualOperationGroups = await Promise.all(
          mutualIds.map((mutualId) => getMutualOperations(
            mutualId,
            dateRange || undefined
          ))
        )
        if (cancelled || requestId !== mutualOperationsRequestId.current) return

        const uniqueOperations = new Map<string, OperationHistoryItem>()
        const names: Record<string, string> = {}

        mutualOperationGroups.flat()
          .filter((operation) => operation.userId !== currentUserId && !operation.settlementId)
          .forEach((operation) => {
            const historyKey = `${operation.accountId}:${operation.assetId}:${operation.id}`
            uniqueOperations.set(historyKey, {
              id: operation.id,
              type: operation.type,
              userId: operation.userId,
              title: operation.title,
              amount: operation.amount,
              category: operation.category,
              comment: operation.comment,
              datetime: Timestamp.fromDate(operation.datetime),
              purposeId: operation.purposeId,
              settlementId: operation.settlementId,
              settlementDirection: operation.settlementDirection,
              historyKey,
              assetAccountId: operation.accountId,
              assetAccountTitle: operation.accountTitle,
              assetId: operation.assetId,
              assetTitle: operation.assetTitle,
              assetCurrency: operation.assetCurrency,
            })
            names[operation.userId] = operation.userName
          })

        const loadedOperations = Array.from(uniqueOperations.values())
        mutualOperationsCache.current.set(cacheKey, loadedOperations)
        setMutualOperations(loadedOperations)
        setUserNames((currentNames) => ({ ...currentNames, ...names }))
      } catch (error) {
        if (cancelled || requestId !== mutualOperationsRequestId.current) return
        logger.error('Error loading mutual participant operations', error)
        toast.error('Mutual participant operations could not be loaded.')
      } finally {
        if (!cancelled && requestId === mutualOperationsRequestId.current) {
          setIsMutualHistoryLoading(false)
        }
      }
    }

    void loadMutualParticipantOperations()
    return () => {
      cancelled = true
    }
  }, [dateRange, mutualIds, showMutualOperations, user])

  // Filter operations by date range
  useEffect(() => {
    const visibleOperations = showMutualOperations
      ? [...operations, ...mutualOperations]
      : operations
    const uniqueOperations = Array.from(new Map(
      visibleOperations.map((operation) => [operation.historyKey, operation])
    ).values())

    if (!dateRange) {
      setFilteredOperations(uniqueOperations)
    } else {
      const filtered = uniqueOperations.filter((op) => {
        const opDate = op.datetime.toDate()
        return opDate >= dateRange.from && opDate <= dateRange.to
      })
      setFilteredOperations(filtered.sort(
        (first, second) => second.datetime.toMillis() - first.datetime.toMillis()
      ))
    }
  }, [dateRange, mutualOperations, operations, showMutualOperations])

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
      if (!sourceAsset) {
        toast.info('Mutual participant operations are read-only here.')
        return
      }
      setSelectedAsset(sourceAsset)
      setSelectedOperation(operation)
      setAdvancedContextVisible(false)
    }
  }

  const handleCancelEdit = () => {
    setSelectedOperation(null)
    setAdvancedContextVisible(false)
  }

  const handleCreateCategory = useCallback(async (input: CategoryInput) => {
    if (!selectedAsset) throw new Error('Select an asset to create a category.')
    const normalizedTitle = input.title.trim().toLocaleLowerCase()
    const existing = selectedCategoryDefinitions.find((category) =>
      category.title.trim().toLocaleLowerCase() === normalizedTitle
    )
    if (existing) return existing

    const siblingOrders = selectedCategoryDefinitions
      .filter((category) => category.parentCategoryId === input.parentCategoryId)
      .map((category) => category.sortOrder)
    const created = await createAccountCategory(selectedAsset.accountId, {
      ...input,
      sortOrder: Math.max(-1, ...siblingOrders) + 1,
    })
    setCategoryDefinitions((current) => [...current, created])
    toast.success('Category created')
    return created
  }, [selectedAsset, selectedCategoryDefinitions])

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
            categoryId: data.categoryId,
            comment: data.comment,
            datetime: data.datetime,
            userId: user.uid,
            purposeId: data.purposeId,
            fuelDetails: data.fuelDetails,
            additionalFields: data.additionalFields,
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
          categoryId: data.categoryId,
          comment: data.comment,
          datetime: data.datetime,
          userId: user.uid,
          purposeId: data.purposeId,
          fuelDetails: data.fuelDetails,
          additionalFields: data.additionalFields,
        })
        if (data.type === 'payment' || data.type === 'income') {
          await safelyRecordOperationTemplate(user.uid, {
            type: data.type,
            title: data.title,
            amount: data.amount,
            category: data.category,
            comment: data.comment,
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
      setAdvancedContextVisible(false)
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
  const localAccountIds = useMemo(
    () => new Set(assetOptions.map((option) => option.accountId)),
    [assetOptions]
  )
  const isVisibleHistoryLoading = isHistoryLoading
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
            {!compact && !formPreferences.simpleMode && assetOptions.length > 1 && <div className={styles.assetSelector}>
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
                <div className={styles.formHeading}>
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
                  {formPreferences.simpleMode && !selectedOperation && operationContext && (
                    <div className={styles.simpleHeadingContext}>
                      <div className={styles.simpleHeadingValues}>
                        <span>{operationContext.typeLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span title={operationContext.assetLabel}>{operationContext.assetLabel}</span>
                        {operationContext.purposeLabel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{operationContext.purposeLabel}</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.contextButton}
                        onClick={() => setAdvancedContextVisible((visible) => !visible)}
                        aria-label={advancedContextVisible
                          ? 'Hide operation context controls'
                          : 'Change operation context'}
                        aria-pressed={advancedContextVisible}
                        title={advancedContextVisible ? 'Hide context controls' : 'Change context'}
                      >
                        <SlidersHorizontal aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
                <OperationForm
                  onSubmit={handleSubmit}
                  onDelete={handleDeleteClick}
                  categories={categorySuggestions}
                  categoryDefinitions={selectedCategoryDefinitions}
                  onCreateCategory={handleCreateCategory}
                  editOperation={selectedOperation}
                  onCancelEdit={handleCancelEdit}
                  isSubmitting={isSubmitting}
                  currentAsset={selectedAsset}
                  availableAssets={assetOptions}
                  onAssetChange={handleAssetIndexChange}
                  purposes={selectedAsset && mutualAccountIds.has(selectedAsset.accountId) ? purposes : []}
                  loanMutuals={loanMutuals}
                  operationTemplates={operationTemplates}
                  simpleMode={formPreferences.simpleMode}
                  defaultAssetId={formPreferences.defaultAssetId}
                  defaultOperationType={formPreferences.defaultOperationType}
                  defaultPurposeId={formPreferences.defaultPurposeId}
                  advancedContextVisible={advancedContextVisible}
                  onContextChange={setOperationContext}
                  compact={compact}
                />
              </div>

              <div className={`${styles.tableSection} ${compact ? styles.compactTableSection : ''}`}>
                {compact ? (
                  <div className={styles.compactHistoryToolbar}>
                    <h2>
                      History
                      {mutualIds.length > 0 && (
                        <button
                          type="button"
                          className={styles.mutualHistoryButton}
                          onClick={() => setShowMutualOperations((visible) => !visible)}
                          aria-label={showMutualOperations
                            ? 'Show only my operations'
                            : 'Show mutual participant operations'}
                          aria-pressed={showMutualOperations}
                          aria-busy={showMutualOperations && isMutualHistoryLoading}
                          title={showMutualOperations && isMutualHistoryLoading
                            ? 'Loading mutual participant operations'
                            : showMutualOperations
                              ? 'Show only my operations'
                              : 'Show mutual participant operations'}
                        >
                          {showMutualOperations && isMutualHistoryLoading
                            ? <LoaderCircle className={styles.mutualHistorySpinner} aria-hidden="true" />
                            : <Users aria-hidden="true" />}
                        </button>
                      )}
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
                    {mutualIds.length > 0 && (
                      <button
                        type="button"
                        className={styles.mutualHistoryButton}
                        onClick={() => setShowMutualOperations((visible) => !visible)}
                        aria-label={showMutualOperations
                          ? 'Show only my operations'
                          : 'Show mutual participant operations'}
                        aria-pressed={showMutualOperations}
                        aria-busy={showMutualOperations && isMutualHistoryLoading}
                        title={showMutualOperations && isMutualHistoryLoading
                          ? 'Loading mutual participant operations'
                          : showMutualOperations
                            ? 'Show only my operations'
                            : 'Show mutual participant operations'}
                      >
                        {showMutualOperations && isMutualHistoryLoading
                          ? <LoaderCircle className={styles.mutualHistorySpinner} aria-hidden="true" />
                          : <Users aria-hidden="true" />}
                      </button>
                    )}
                  </h2>
                )}
                {!compact && <p className={styles.tableHint}>Click a row to edit or delete</p>}
                <div className={compact ? styles.historyScroll : ''}>
                  {isVisibleHistoryLoading ? (
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
                      localAccountIds={localAccountIds}
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
