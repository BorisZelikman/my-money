import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { AccountAccordion } from '@/features/accounts/components/AccountAccordion'
import { AssetsList, getAllAssetsForAccounts } from '@/features/assets'
import { ViewToggle, type ViewMode } from '@/components/ui'
import { NavBar } from '@/components/layout'
import {
  getUserPreferences,
  createUserPreferences,
  updateUserPreference,
} from '../services/userService'
import { getAccountsWithUsers } from '@/features/accounts/services/accountService'
import type { UserPreferences, AccountWithUsers, Asset } from '@/types'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null)
  const [accounts, setAccounts] = useState<AccountWithUsers[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('Accounts')
  const [isLoading, setIsLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          setAccounts(accountsData)
        }
      } catch (err) {
        console.error('Error loading user data:', err)
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
          setAssets(allAssets)
        } catch (err) {
          console.error('Error loading assets:', err)
        } finally {
          setAssetsLoading(false)
        }
      }
    }
    loadAssets()
  }, [viewMode, accounts, assets.length])

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode)
    // Persist view mode preference
    if (user) {
      try {
        await updateUserPreference(user.uid, 'viewMode', mode)
      } catch (err) {
        console.error('Error saving view preference:', err)
      }
    }
  }

  const handleAssetClick = (asset: Asset) => {
    console.log('Asset clicked:', asset)
    // TODO: Navigate to asset operations in MVP 4
  }

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
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} />
            ) : (
              <span>{userPrefs?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className={styles.userDetails}>
            <h1>Welcome, {userPrefs?.name || user?.displayName || 'User'}!</h1>
            <p className={styles.email}>{user?.email}</p>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={signOut}>
          Sign Out
        </button>
      </header>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span> {error}
        </div>
      )}

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>{viewMode === 'Accounts' ? 'Your Accounts' : 'Your Assets'}</h2>
            <span className={styles.badge}>
              {viewMode === 'Accounts' ? accounts.length : assets.length}
            </span>
          </div>

          <div className={styles.viewToggleWrapper}>
            <ViewToggle value={viewMode} onChange={handleViewModeChange} />
          </div>

          {viewMode === 'Accounts' ? (
            accounts.length > 0 ? (
              <div className={styles.accountsList}>
                {accounts.map((account) => (
                  <AccountAccordion
                    key={account.id}
                    account={account}
                    onAssetClick={handleAssetClick}
                  />
                ))}
              </div>
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
            <AssetsList assets={assets} onAssetClick={handleAssetClick} />
          )}
        </section>

      </main>
    </div>
  )
}
