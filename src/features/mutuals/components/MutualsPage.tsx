import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { NavBar } from '@/components/layout/NavBar'
import { DateRangePicker, type DateRange } from '@/components/ui'
import { MutualOperationsTable } from './MutualOperationsTable'
import {
  SettlementSummary,
  type SettlementTransferDraft,
} from './SettlementSummary'
import { LoanLedger } from './LoanLedger'
import { MutualInvitations } from '@/features/profile/components/MutualInvitations'
import {
  getMutual,
  getMutualOperations,
  calculateSettlement,
  getAppliedSettlements,
  getLegacySettlements,
  applySettlementTransfer,
  getSettlementPurpose,
  getPendingMutualInvitations,
  acceptMutualInvitation,
  declineMutualInvitation,
} from '../services/mutualService'
import { getAssetsByAccountId } from '@/features/assets'
import { getAccountsWithUsers } from '@/features/accounts/services/accountService'
import { getUserPreferences } from '@/features/profile/services/userService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import type {
  AppliedSettlement,
  Asset,
  Mutual,
  MutualOperation,
  SettlementData,
  AccountWithUsers,
  MutualInvitation,
} from '@/types'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getPurposeIcon } from '@/utils/icons'
import styles from './MutualsPage.module.css'

type SharedView = 'expenses' | 'loans'

export function MutualsPage() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [mutuals, setMutuals] = useState<Mutual[]>([])
  const [selectedMutual, setSelectedMutual] = useState<Mutual | null>(null)
  const [operations, setOperations] = useState<MutualOperation[]>([])
  const [filteredOperations, setFilteredOperations] = useState<MutualOperation[]>([])
  const [settlements, setSettlements] = useState<SettlementData[]>([])
  const [appliedSettlements, setAppliedSettlements] = useState<AppliedSettlement[]>([])
  const [assetsByAccount, setAssetsByAccount] = useState<Record<string, Asset[]>>({})
  const [accountTitles, setAccountTitles] = useState<Record<string, string>>({})
  const [accountUsers, setAccountUsers] = useState<Record<string, string[]>>({})
  const [availableAccounts, setAvailableAccounts] = useState<AccountWithUsers[]>([])
  const [mutualInvitations, setMutualInvitations] = useState<MutualInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOperations, setIsLoadingOperations] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all')
  const [activeView, setActiveView] = useState<SharedView>('expenses')
  const [isApplyingSettlement, setIsApplyingSettlement] = useState(false)
  const isApplyingSettlementRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!user) return

    try {
        setIsLoading(true)
        const prefs = await getUserPreferences(user.uid)

        const accountIds = prefs?.accounts?.map((account) => account.id) || []
        const [profileAccounts, invitations] = await Promise.all([
          getAccountsWithUsers(accountIds),
          user.email ? getPendingMutualInvitations(user.email) : Promise.resolve([]),
        ])
        setAvailableAccounts(profileAccounts)
        setMutualInvitations(invitations)
        const mutualIds = Array.from(new Set(prefs?.mutuals || []))

        if (mutualIds.length > 0) {
          const loadedMutuals: Mutual[] = []
          const titles: Record<string, string> = {}
          const loadedAssets: Record<string, Asset[]> = {}
          const loadedAccountUsers: Record<string, string[]> = {}

          for (const mutualId of mutualIds) {
            const mutual = await getMutual(mutualId)
            if (mutual) {
              loadedMutuals.push(mutual)

              // Get account titles for each participant
              for (const participant of mutual.participants) {
                if (!titles[participant.accountId]) {
                  const accountDoc = await getDoc(
                    doc(db, 'accounts', participant.accountId)
                  )
                  if (accountDoc.exists()) {
                    titles[participant.accountId] = accountDoc.data().title || 'Unknown'
                    loadedAccountUsers[participant.accountId] = Array.isArray(
                      accountDoc.data().users
                    ) ? accountDoc.data().users : []
                  }
                }
                if (!loadedAssets[participant.accountId]) {
                  loadedAssets[participant.accountId] = await getAssetsByAccountId(
                    participant.accountId
                  )
                }
              }
            }
          }

          setMutuals(loadedMutuals)
          setAccountTitles(titles)
          setAssetsByAccount(loadedAssets)
          setAccountUsers(loadedAccountUsers)

          if (loadedMutuals.length > 0) {
            setSelectedMutual(loadedMutuals[0])
          }
        } else {
          setMutuals([])
          setSelectedMutual(null)
          setAccountTitles({})
          setAssetsByAccount({})
          setAccountUsers({})
        }
    } catch (error) {
      logger.error('Error loading mutuals', error)
      toast.error('Failed to load shared expenses data.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Load user's mutuals and incoming invitations.
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [loadData, user])

  const handleAcceptInvitation = async (
    invitation: MutualInvitation,
    accountId: string,
    assetId: string
  ) => {
    if (!user) return
    await acceptMutualInvitation(invitation, user.uid, accountId, assetId)
    setMutualInvitations((previous) =>
      previous.filter((item) => item.mutualId !== invitation.mutualId)
    )
    await loadData()
    toast.success('Invitation accepted')
  }

  const handleDeclineInvitation = async (invitation: MutualInvitation) => {
    if (!user) return
    await declineMutualInvitation(invitation, user.uid)
    setMutualInvitations((previous) =>
      previous.filter((item) => item.mutualId !== invitation.mutualId)
    )
    toast.success('Invitation declined')
  }

  // Always load all operations: the full set is needed for legacy settlement history.
  const loadOperations = useCallback(async () => {
    if (!selectedMutual) return

    try {
      setIsLoadingOperations(true)
      const ops = await getMutualOperations(selectedMutual.id)
      setOperations(ops)
    } catch (error) {
      logger.error('Error loading operations', error)
    } finally {
      setIsLoadingOperations(false)
    }
  }, [selectedMutual])

  useEffect(() => {
    loadOperations()
  }, [loadOperations])

  const loadAppliedSettlements = useCallback(async () => {
    if (!selectedMutual) return

    try {
      setAppliedSettlements(await getAppliedSettlements(selectedMutual.id))
    } catch (error) {
      // Older deployments do not have settlement subcollection rules yet.
      logger.error('Error loading settlement history', error)
      setAppliedSettlements([])
    }
  }, [selectedMutual])

  useEffect(() => {
    loadAppliedSettlements()
  }, [loadAppliedSettlements])

  const settlementHistory = useMemo(() => {
    if (!selectedMutual) return []

    return [
      ...appliedSettlements,
      ...getLegacySettlements(selectedMutual, operations, accountTitles),
    ].sort((a, b) => {
      const appliedDifference = b.appliedAt.getTime() - a.appliedAt.getTime()
      if (appliedDifference !== 0) return appliedDifference
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    })
  }, [accountTitles, appliedSettlements, operations, selectedMutual])

  // Filter by purpose and calculate settlements
  useEffect(() => {
    if (!selectedMutual) return

    const settlementPurposeIds = new Set(
      selectedMutual.purposes
        .filter((purpose) => purpose.isSettlement)
        .map((purpose) => purpose.id)
    )
    let filtered = operations.filter((operation) => {
      if (settlementPurposeIds.has(operation.purposeId)) return false
      if (!dateRange) return true
      return operation.datetime >= dateRange.from && operation.datetime <= dateRange.to
    })

    if (selectedPurpose !== 'all') {
      filtered = filtered.filter((op) => op.purposeId === selectedPurpose)
    }

    setFilteredOperations(filtered)

    const relevantSettlements = settlementHistory.filter((settlement) => {
      const matchesDate =
        !dateRange ||
        (settlement.appliedAt >= dateRange.from && settlement.appliedAt <= dateRange.to)
      const matchesPurpose =
        selectedPurpose === 'all' || settlement.scopePurposeId === selectedPurpose
      return matchesDate && matchesPurpose
    })

    setSettlements(
      calculateSettlement(
        selectedMutual,
        filtered,
        accountTitles,
        relevantSettlements
      )
    )
  }, [
    operations,
    selectedPurpose,
    selectedMutual,
    accountTitles,
    dateRange,
    settlementHistory,
  ])

  const refreshSelectedAssets = useCallback(async () => {
    if (!selectedMutual) return

    const entries = await Promise.all(
      selectedMutual.participants.map(async (participant) => [
        participant.accountId,
        await getAssetsByAccountId(participant.accountId),
      ] as const)
    )
    setAssetsByAccount((current) => ({ ...current, ...Object.fromEntries(entries) }))
  }, [selectedMutual])

  const handleApplySettlement = async (draft: SettlementTransferDraft) => {
    if (!user || !selectedMutual || isApplyingSettlementRef.current) return

    const settlementPurpose = getSettlementPurpose(selectedMutual)
    if (!settlementPurpose) {
      toast.error('This mutual group has no settlement purpose configured.')
      return
    }

    const scopePurpose =
      selectedPurpose === 'all'
        ? null
        : selectedMutual.purposes.find((purpose) => purpose.id === selectedPurpose) || null

    isApplyingSettlementRef.current = true
    setIsApplyingSettlement(true)
    try {
      await applySettlementTransfer(selectedMutual.id, {
        ...draft,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unknown',
        settlementPurposeId: settlementPurpose.id,
        scopePurposeId: scopePurpose?.id || null,
        scopePurposeTitle: scopePurpose?.title || 'All purposes',
      })
      await Promise.all([
        loadOperations(),
        loadAppliedSettlements(),
        refreshSelectedAssets(),
      ])
      toast.success('Settlement transfer applied.')
    } catch (error) {
      logger.error('Error applying settlement transfer', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply settlement.')
      throw error
    } finally {
      isApplyingSettlementRef.current = false
      setIsApplyingSettlement(false)
    }
  }

  const handleMutualChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mutualId = e.target.value
    const mutual = mutuals.find((m) => m.id === mutualId) || null
    setSelectedMutual(mutual)
    setSelectedPurpose('all')
    setAppliedSettlements([])
  }

  const handleViewChange = (view: SharedView) => {
    setActiveView(view)

    const selectedMatchesView = view === 'loans'
      ? selectedMutual?.type === 'loan'
      : selectedMutual?.type !== 'loan'
    if (selectedMatchesView) return

    const defaultMutual = mutuals.find((mutual) =>
      view === 'loans' ? mutual.type === 'loan' : mutual.type !== 'loan'
    )
    if (defaultMutual) {
      setSelectedMutual(defaultMutual)
      setSelectedPurpose('all')
      setAppliedSettlements([])
    }
  }

  const handlePurposeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPurpose(e.target.value)
  }

  // Get non-settlement purposes for filter
  const filterPurposes = selectedMutual?.purposes.filter((p) => !p.isSettlement) || []

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>{t('common.loading')}</p>
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
          <h1>{activeView === 'loans' ? t('mutuals.loanLedger') : t('mutuals.sharedExpenses')}</h1>
          <p className={styles.subtitle}>
            {activeView === 'loans'
              ? t('mutuals.trackLoans')
              : t('mutuals.trackShared')}
          </p>
        </header>

        {!isLoading && (
          <MutualInvitations
            invitations={mutualInvitations}
            accounts={availableAccounts}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
          />
        )}

        {isLoading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>{t('mutuals.loadingGroups')}</p>
          </div>
        ) : mutuals.length === 0 && mutualInvitations.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🤝</span>
            <h3>{t('mutuals.noGroups')}</h3>
            <p>{t('mutuals.noGroupsHelp')}</p>
          </div>
        ) : (
          <>
            <div className={styles.viewTabs} role="tablist" aria-label="Shared view">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'expenses'}
                className={activeView === 'expenses' ? styles.activeViewTab : ''}
                onClick={() => handleViewChange('expenses')}
              >
                {t('mutuals.sharedExpenses')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'loans'}
                className={activeView === 'loans' ? styles.activeViewTab : ''}
                onClick={() => handleViewChange('loans')}
              >
                {t('mutuals.loanLedger')}
              </button>
            </div>

            <div className={`${styles.selectors} ${activeView === 'loans' ? styles.singleSelector : ''}`}>
              <div className={styles.selectorField}>
                <label htmlFor="mutual-select">{t('mutuals.mutualGroup')}</label>
                <select
                  id="mutual-select"
                  value={selectedMutual?.id || ''}
                  onChange={handleMutualChange}
                >
                  {mutuals.map((mutual) => (
                    <option key={mutual.id} value={mutual.id}>
                      {mutual.title}
                    </option>
                  ))}
                </select>
              </div>

              {activeView === 'expenses' && (
                <div className={styles.selectorField}>
                  <label htmlFor="purpose-select">{t('mutuals.purpose')}</label>
                  <select
                    id="purpose-select"
                    value={selectedPurpose}
                    onChange={handlePurposeChange}
                  >
                    <option value="all">{t('mutuals.allPurposes')}</option>
                    {filterPurposes.map((purpose) => (
                      <option key={purpose.id} value={purpose.id}>
                        {getPurposeIcon(purpose.icon)} {purpose.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeView === 'loans' && selectedMutual ? (
              <LoanLedger
                mutual={selectedMutual}
                accountTitles={accountTitles}
                assetsByAccount={assetsByAccount}
                memberUserIds={Array.from(new Set(
                  selectedMutual.participants.flatMap(
                    (participant) => accountUsers[participant.accountId] || []
                  )
                ))}
                userId={user?.uid || ''}
                userName={user?.displayName || user?.email || 'Unknown'}
                onAssetsChanged={refreshSelectedAssets}
              />
            ) : (
              <>
                <div className={styles.filterSection}>
                  <h2>{t('mutuals.filterDate')}</h2>
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                {isLoadingOperations ? (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>{t('common.loading')}</p>
                  </div>
                ) : (
                  <>
                    <SettlementSummary
                      settlements={settlements}
                      mutual={selectedMutual}
                      assetsByAccount={assetsByAccount}
                      history={settlementHistory}
                      isApplying={isApplyingSettlement}
                      onApplySettlement={handleApplySettlement}
                    />

                    <div className={styles.tableSection}>
                      <h2>
                        {t('mutuals.sharedExpenses')}
                        <span className={styles.badge}>{filteredOperations.length}</span>
                      </h2>
                      <MutualOperationsTable operations={filteredOperations} />
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

