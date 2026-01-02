import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { AccountAccordion } from '@/features/accounts/components/AccountAccordion'
import { getAllAssetsForAccounts } from '@/features/assets'
import { ViewToggle, type ViewMode, SortableList } from '@/components/ui'
import { NavBar } from '@/components/layout'
import {
  getUserPreferences,
  createUserPreferences,
  updateUserPreference,
} from '../services/userService'
import { getAccountsWithUsers } from '@/features/accounts/services/accountService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import type { UserPreferences, AccountWithUsers, Asset, UserAccount, UserAsset } from '@/types'
import styles from './ProfilePage.module.css'

interface SortableAccount extends AccountWithUsers {
  switched: boolean
}

interface SortableAsset extends Asset {
  hidden: boolean
}

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null)
  const [accounts, setAccounts] = useState<SortableAccount[]>([])
  const [assets, setAssets] = useState<SortableAsset[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('Accounts')
  const [isLoading, setIsLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        // Get or create user preferences
        let prefs = await getUserPreferences(user.uid)
        if (!prefs) {
          prefs = await createUserPreferences(
            user.uid,
            user.displayName || '',
            user.email || undefined
          )
        }
        setUserPrefs(prefs)
        setViewMode(prefs.viewMode || 'Accounts')

        // Load accounts if user has any
        if (prefs.accounts && prefs.accounts.length > 0) {
          const accountIds = prefs.accounts.map((a) => a.id)
          const accountsData = await getAccountsWithUsers(accountIds)
          
          // Sort accounts according to user preferences order and add switched state
          const sortedAccounts: SortableAccount[] = prefs.accounts
            .map((prefAccount) => {
              const account = accountsData.find((a) => a.id === prefAccount.id)
              return account ? { ...account, switched: prefAccount.switched } : null
            })
            .filter((a): a is SortableAccount => a !== null)
          
          setAccounts(sortedAccounts)
        }
      } catch (err) {
        logger.error('Error loading user data', err)
        toast.error('Failed to load profile data.')
        setError('Failed to load user data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadUserData()
    }
  }, [user])

  // Load all assets when switching to Assets view
  useEffect(() => {
    async function loadAssets() {
      if (viewMode === 'Assets' && accounts.length > 0 && assets.length === 0) {
        setAssetsLoading(true)
        try {
          const accountIds = accounts.map((a) => a.id)
          const allAssets = await getAllAssetsForAccounts(accountIds)
          
          // Apply user's asset preferences (order and visibility)
          const assetPrefs = userPrefs?.assets || []
          const sortedAssets: SortableAsset[] = []
          
          // First add assets in user's preferred order
          for (const pref of assetPrefs) {
            const asset = allAssets.find((a) => a.id === pref.id)
            if (asset) {
              sortedAssets.push({ ...asset, hidden: pref.hide || false })
            }
          }
          
          // Then add any remaining assets not in preferences
          for (const asset of allAssets) {
            if (!sortedAssets.find((a) => a.id === asset.id)) {
              sortedAssets.push({ ...asset, hidden: false })
            }
          }
          
          setAssets(sortedAssets)
        } catch (err) {
          logger.error('Error loading assets', err)
        } finally {
          setAssetsLoading(false)
        }
      }
    }
    loadAssets()
  }, [viewMode, accounts, assets.length, userPrefs?.assets])

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode)
    // Persist view mode preference
    if (user) {
      try {
        await updateUserPreference(user.uid, 'viewMode', mode)
      } catch (err) {
        logger.error('Error saving view preference', err)
      }
    }
  }

  const handleAssetClick = (asset: Asset) => {
    logger.log('Asset clicked:', asset)
    // TODO: Navigate to asset operations
  }

  const handleAccountsReorder = useCallback(async (reorderedAccounts: SortableAccount[]) => {
    if (!user) return
    
    setAccounts(reorderedAccounts)
    setIsReordering(true)
    
    try {
      const newAccountsOrder: UserAccount[] = reorderedAccounts.map((a) => ({
        id: a.id,
        switched: a.switched,
      }))
      await updateUserPreference(user.uid, 'accounts', newAccountsOrder)
    } catch (err) {
      logger.error('Error saving accounts order', err)
      toast.error('Failed to save order.')
    } finally {
      setIsReordering(false)
    }
  }, [user])

  const handleAssetsReorder = useCallback(async (reorderedAssets: SortableAsset[]) => {
    if (!user) return
    
    setAssets(reorderedAssets)
    setIsReordering(true)
    
    try {
      const newAssetsOrder: UserAsset[] = reorderedAssets.map((a, index) => ({
        id: a.id,
        hide: a.hidden,
        index,
      }))
      await updateUserPreference(user.uid, 'assets', newAssetsOrder)
    } catch (err) {
      logger.error('Error saving assets order', err)
      toast.error('Failed to save order.')
    } finally {
      setIsReordering(false)
    }
  }, [user])

  const handleAssetVisibilityToggle = useCallback(async (assetId: string) => {
    if (!user) return
    
    const updatedAssets = assets.map((a) =>
      a.id === assetId ? { ...a, hidden: !a.hidden } : a
    )
    setAssets(updatedAssets)
    
    try {
      const newAssetsOrder: UserAsset[] = updatedAssets.map((a, index) => ({
        id: a.id,
        hide: a.hidden,
        index,
      }))
      await updateUserPreference(user.uid, 'assets', newAssetsOrder)
    } catch (err) {
      logger.error('Error saving asset visibility', err)
    }
  }, [user, assets])

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <NavBar />

      {error && (
        <div className={styles.error}>
          <span>⚠️</span> {error}
        </div>
      )}

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.viewToggleWrapper}>
              <ViewToggle 
                value={viewMode} 
                onChange={handleViewModeChange}
                accountsCount={accounts.length}
                assetsVisibleCount={assets.filter(a => !a.hidden).length}
                assetsTotalCount={assets.length}
              />
            </div>
            {isReordering && <span className={styles.savingBadge}>Saving...</span>}
          </div>

          {viewMode === 'Accounts' ? (
            accounts.length > 0 ? (
              <SortableList
                items={accounts}
                onReorder={handleAccountsReorder}
                renderItem={(account) => (
                  <AccountAccordion
                    account={account}
                    onAssetClick={handleAssetClick}
                    embedded
                  />
                )}
              />
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💼</span>
                <h3>No accounts yet</h3>
                <p>You don't have any accounts linked to your profile.</p>
              </div>
            )
          ) : assetsLoading ? (
            <div className={styles.loader}>
              <div className={styles.spinner}></div>
              <p>Loading assets...</p>
            </div>
          ) : (
            <SortableList
              items={assets}
              onReorder={handleAssetsReorder}
              renderItem={(asset) => (
                <div className={`${styles.assetItem} ${asset.hidden ? styles.assetHidden : ''}`}>
                  <div className={styles.assetInfo}>
                    <span className={styles.assetTitle}>{asset.title}</span>
                    <span className={styles.assetAccount}>{asset.accountId}</span>
                  </div>
                  <div className={styles.assetAmount}>
                    <span className={asset.amount >= 0 ? styles.positive : styles.negative}>
                      {asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {asset.currency}
                    </span>
                  </div>
                  <button
                    className={styles.visibilityToggle}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAssetVisibilityToggle(asset.id)
                    }}
                    aria-label={asset.hidden ? 'Show asset' : 'Hide asset'}
                  >
                    {asset.hidden ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              )}
            />
          )}
        </section>
      </main>
    </div>
  )
}
