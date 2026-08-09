import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { NavBar } from '@/components/layout/NavBar'
import { DateRangePicker, type DateRange } from '@/components/ui'
import { MutualOperationsTable } from './MutualOperationsTable'
import {
  SettlementSummary,
  type SettlementTransferDraft,
} from './SettlementSummary'
import { LoanLedger } from './LoanLedger'
import {
  getMutual,
  getMutualOperations,
  calculateSettlement,
  getAppliedSettlements,
  getLegacySettlements,
  applySettlementTransfer,
  getMutualIdsByAccountIds,
  getSettlementPurpose,
} from '../services/mutualService'
import { getAssetsByAccountId } from '@/features/assets'
import { getUserPreferences } from '@/features/profile/services/userService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import type {
  AppliedSettlement,
  Asset,
  Mutual,
  MutualOperation,
  SettlementData,
} from '@/types'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getPurposeIcon } from '@/utils/icons'
import styles from './MutualsPage.module.css'

type SharedView = 'expenses' | 'loans'

export function MutualsPage() {
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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOperations, setIsLoadingOperations] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all')
  const [activeView, setActiveView] = useState<SharedView>('expenses')
  const [isApplyingSettlement, setIsApplyingSettlement] = useState(false)
  const isApplyingSettlementRef = useRef(false)

  // Load user's mutuals
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setIsLoading(true)
        const prefs = await getUserPreferences(user.uid)

        const accountIds = prefs?.accounts?.map((account) => account.id) || []
        let discoveredMutualIds: string[] = []
        if (accountIds.length > 0) {
          try {
            discoveredMutualIds = await getMutualIdsByAccountIds(accountIds)
          } catch (error) {
            // Keep profile-linked mutuals available during a staged rules rollout.
            logger.error('Error discovering mutuals by account', error)
          }
        }
        const mutualIds = Array.from(new Set([
          ...(prefs?.mutuals || []),
          ...discoveredMutualIds,
        ]))

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
    }

    if (user) {
      loadData()
    }
  }, [user])

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
          <h1>{activeView === 'loans' ? 'Loan Ledger' : 'Shared Expenses'}</h1>
          <p className={styles.subtitle}>
            {activeView === 'loans'
              ? 'Track advances, repayments, and current debt'
              : 'Track and settle mutual expenses'}
          </p>
        </header>

        {isLoading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading mutuals...</p>
          </div>
        ) : mutuals.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🤝</span>
            <h3>No shared accounts</h3>
            <p>You are not part of any mutual expense sharing group.</p>
          </div>
        ) : (
          <>
            <div className={styles.viewTabs} role="tablist" aria-label="Shared view">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'expenses'}
                className={activeView === 'expenses' ? styles.activeViewTab : ''}
                onClick={() => setActiveView('expenses')}
              >
                Shared expenses
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'loans'}
                className={activeView === 'loans' ? styles.activeViewTab : ''}
                onClick={() => setActiveView('loans')}
              >
                Loan ledger
              </button>
            </div>

            <div className={`${styles.selectors} ${activeView === 'loans' ? styles.singleSelector : ''}`}>
              <div className={styles.selectorField}>
                <label htmlFor="mutual-select">Mutual Group</label>
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
                  <label htmlFor="purpose-select">Purpose</label>
                  <select
                    id="purpose-select"
                    value={selectedPurpose}
                    onChange={handlePurposeChange}
                  >
                    <option value="all">All purposes</option>
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
                  <h2>Filter by Date</h2>
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                {isLoadingOperations ? (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Loading shared operations...</p>
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
                        Shared Operations
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

