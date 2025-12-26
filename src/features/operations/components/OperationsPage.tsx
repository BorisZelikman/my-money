import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { OperationsTable } from './OperationsTable'
import { OperationForm } from './OperationForm'
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
import { getAccountsWithUsers } from '@/features/accounts/services/accountService'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import { getUserPreferences } from '@/features/profile/services/userService'
import { getMutual } from '@/features/mutuals/services/mutualService'
import type { Operation, AccountWithUsers, Asset, OperationType, MutualPurpose } from '@/types'
import styles from './OperationsPage.module.css'

interface AssetOption {
  accountId: string
  accountTitle: string
  asset: Asset
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

          // Load all assets for all accounts
          const options: AssetOption[] = []
          for (const account of accountsData) {
            const assets = await getAssetsByAccountId(account.id)
            for (const asset of assets) {
              options.push({
                accountId: account.id,
                accountTitle: account.title,
                asset,
              })
            }
          }
          setAssetOptions(options)

          // Auto-select first asset
          if (options.length > 0) {
            setSelectedAsset(options[0])
          }

          // Load mutuals to get purposes
          if (prefs.mutuals && prefs.mutuals.length > 0) {
            const mutualAccIds = new Set<string>()
            let allPurposes: MutualPurpose[] = []

            for (const mutualId of prefs.mutuals) {
              const mutual = await getMutual(mutualId)
              if (mutual) {
                // Track which accounts are in mutuals
                for (const p of mutual.participants) {
                  mutualAccIds.add(p.accountId)
                }
                // Collect purposes (filter out settlement purposes)
                allPurposes = [...allPurposes, ...mutual.purposes.filter(p => !p.isSettlement)]
              }
            }
            setMutualAccountIds(mutualAccIds)
            setPurposes(allPurposes)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
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
      setOperations(ops)

      const cats = await getUniqueCategories(
        selectedAsset.accountId,
        selectedAsset.asset.id
      )
      setCategories(cats)
    } catch (error) {
      console.error('Error loading operations:', error)
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
    if (selectedOperation?.id === operation.id) {
      setSelectedOperation(null)
    } else {
      setSelectedOperation(operation)
    }
  }

  const handleCancelEdit = () => {
    setSelectedOperation(null)
  }

  const handleSubmit = async (data: {
    type: OperationType
    title: string
    amount: number
    category: string
    comment: string
    datetime: Date
    targetAccountId?: string
    targetAssetId?: string
    rate?: number
    purposeId?: string
  }) => {
    if (!selectedAsset || !user) return

    try {
      setIsSubmitting(true)

      if (data.type === 'transfer' && data.targetAccountId && data.targetAssetId) {
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
      console.error('Error saving operation:', error)
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
      console.error('Error deleting operation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  // Calculate totals for filtered operations
  const totals = calculateTotals(filteredOperations)

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
