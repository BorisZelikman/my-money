import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { NavBar } from '@/components/layout/NavBar'
import { DateRangePicker, type DateRange } from '@/components/ui'
import { MutualOperationsTable } from './MutualOperationsTable'
import { SettlementSummary } from './SettlementSummary'
import {
  getMutual,
  getMutualOperations,
  calculateSettlement,
} from '../services/mutualService'
import { getUserPreferences } from '@/features/profile/services/userService'
import type { Mutual, MutualOperation, SettlementData } from '@/types'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getPurposeIcon } from '@/utils/icons'
import styles from './MutualsPage.module.css'

export function MutualsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [mutuals, setMutuals] = useState<Mutual[]>([])
  const [selectedMutual, setSelectedMutual] = useState<Mutual | null>(null)
  const [operations, setOperations] = useState<MutualOperation[]>([])
  const [filteredOperations, setFilteredOperations] = useState<MutualOperation[]>([])
  const [settlements, setSettlements] = useState<SettlementData[]>([])
  const [accountTitles, setAccountTitles] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOperations, setIsLoadingOperations] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all')

  // Load user's mutuals
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setIsLoading(true)
        const prefs = await getUserPreferences(user.uid)

        if (prefs?.mutuals && prefs.mutuals.length > 0) {
          const loadedMutuals: Mutual[] = []
          const titles: Record<string, string> = {}

          for (const mutualId of prefs.mutuals) {
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
                  }
                }
              }
            }
          }

          setMutuals(loadedMutuals)
          setAccountTitles(titles)

          if (loadedMutuals.length > 0) {
            setSelectedMutual(loadedMutuals[0])
          }
        }
      } catch (error) {
        console.error('Error loading mutuals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Load operations when mutual or date range changes
  const loadOperations = useCallback(async () => {
    if (!selectedMutual) return

    try {
      setIsLoadingOperations(true)
      const ops = await getMutualOperations(
        selectedMutual.id,
        dateRange || undefined
      )
      setOperations(ops)
    } catch (error) {
      console.error('Error loading operations:', error)
    } finally {
      setIsLoadingOperations(false)
    }
  }, [selectedMutual, dateRange])

  useEffect(() => {
    loadOperations()
  }, [loadOperations])

  // Filter by purpose and calculate settlements
  useEffect(() => {
    let filtered = operations

    if (selectedPurpose !== 'all') {
      filtered = operations.filter((op) => op.purposeId === selectedPurpose)
    }

    setFilteredOperations(filtered)

    // Calculate settlements
    if (selectedMutual) {
      const settlementData = calculateSettlement(
        selectedMutual,
        filtered,
        accountTitles
      )
      setSettlements(settlementData)
    }
  }, [operations, selectedPurpose, selectedMutual, accountTitles])

  const handleMutualChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mutualId = e.target.value
    const mutual = mutuals.find((m) => m.id === mutualId) || null
    setSelectedMutual(mutual)
    setSelectedPurpose('all')
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
          <h1>Shared Expenses</h1>
          <p className={styles.subtitle}>Track and settle mutual expenses</p>
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
            <div className={styles.selectors}>
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
            </div>

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
      </main>
    </div>
  )
}

