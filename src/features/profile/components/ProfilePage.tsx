import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { AccountAccordion } from '@/features/accounts/components/AccountAccordion'
import { getAllAssetsForAccounts, createAsset, updateAsset, deleteAsset } from '@/features/assets'
import { getMutualsByIds, createMutual, updateMutual, deleteMutual } from '@/features/mutuals'
import { ViewToggle, type ViewMode, SortableList, SwipeableItem, ConfirmDialog } from '@/components/ui'
import { NavBar } from '@/components/layout'
import {
  getUserPreferences,
  createUserPreferences,
  updateUserPreference,
} from '../services/userService'
import { 
  getAccountsWithUsers, 
  createAccount, 
  updateAccount, 
  deleteAccount 
} from '@/features/accounts/services/accountService'
import { logger } from '@/utils/logger'
import { toast } from '@/stores/toastStore'
import { AccountDialog } from './AccountDialog'
import { AssetDialog } from './AssetDialog'
import { MutualDialog } from './MutualDialog'
import type { 
  UserPreferences, 
  AccountWithUsers, 
  Asset, 
  UserAccount, 
  UserAsset,
  Mutual,
  MutualPurpose,
} from '@/types'
import styles from './ProfilePage.module.css'

interface SortableAccount extends AccountWithUsers {
  switched: boolean
}

interface SortableAsset extends Asset {
  hidden: boolean
}

interface SelectOption {
  value: string
  label: string
}

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null)
  const [accounts, setAccounts] = useState<SortableAccount[]>([])
  const [assets, setAssets] = useState<SortableAsset[]>([])
  const [mutuals, setMutuals] = useState<Mutual[]>([])
  const [allPurposes, setAllPurposes] = useState<MutualPurpose[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('Accounts')
  const [isLoading, setIsLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [mutualsLoading, setMutualsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)

  // Preferences state
  const [defaultMutualId, setDefaultMutualId] = useState<string>('none')
  const [defaultPurposeId, setDefaultPurposeId] = useState<string>('none')
  const [defaultAssetId, setDefaultAssetId] = useState<string>('none')
  const [defaultOperationType, setDefaultOperationType] = useState<string>('none')

  // Dialog state
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SortableAccount | null>(null)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<SortableAsset | null>(null)
  const [mutualDialogOpen, setMutualDialogOpen] = useState(false)
  const [editingMutual, setEditingMutual] = useState<Mutual | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'account' | 'asset' | 'mutual'; item: SortableAccount | SortableAsset | Mutual } | null>(null)

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
        
        // Initialize preferences from stored values
        setDefaultMutualId(prefs.defaultMutualId || 'none')
        setDefaultPurposeId(prefs.defaultPurposeId || 'none')
        setDefaultAssetId(prefs.defaultAssetId || 'none')
        setDefaultOperationType(prefs.defaultOperationType || 'none')

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

  // Load all assets when switching to Assets view or for Preferences
  useEffect(() => {
    async function loadAssets() {
      if ((viewMode === 'Assets' || viewMode === 'Preferences') && accounts.length > 0 && assets.length === 0) {
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

  // Load mutuals when switching to Mutuals view or for Preferences
  useEffect(() => {
    async function loadMutuals() {
      if ((viewMode === 'Mutuals' || viewMode === 'Preferences') && 
          userPrefs?.mutuals && 
          userPrefs.mutuals.length > 0 && 
          mutuals.length === 0) {
        setMutualsLoading(true)
        try {
          const mutualsData = await getMutualsByIds(userPrefs.mutuals)
          setMutuals(mutualsData)
          
          // Collect all purposes from all mutuals
          const purposes: MutualPurpose[] = []
          for (const mutual of mutualsData) {
            for (const purpose of mutual.purposes) {
              if (!purposes.find(p => p.id === purpose.id)) {
                purposes.push(purpose)
              }
            }
          }
          setAllPurposes(purposes)
        } catch (err) {
          logger.error('Error loading mutuals', err)
        } finally {
          setMutualsLoading(false)
        }
      }
    }
    loadMutuals()
  }, [viewMode, userPrefs?.mutuals, mutuals.length])

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

  const handlePreferenceChange = useCallback(async (
    field: 'defaultMutualId' | 'defaultPurposeId' | 'defaultAssetId' | 'defaultOperationType',
    value: string
  ) => {
    if (!user) return
    
    // Update local state
    switch (field) {
      case 'defaultMutualId':
        setDefaultMutualId(value)
        break
      case 'defaultPurposeId':
        setDefaultPurposeId(value)
        break
      case 'defaultAssetId':
        setDefaultAssetId(value)
        break
      case 'defaultOperationType':
        setDefaultOperationType(value)
        break
    }

    // Save to Firestore
    setIsSavingPrefs(true)
    try {
      await updateUserPreference(user.uid, field, value === 'none' ? null : value)
      toast.success('Preference saved')
    } catch (err) {
      logger.error(`Error saving ${field}`, err)
      toast.error('Failed to save preference')
    } finally {
      setIsSavingPrefs(false)
    }
  }, [user])

  // Edit and Delete handlers for swipe actions
  const handleEditAccount = useCallback((account: SortableAccount) => {
    setEditingAccount(account)
    setAccountDialogOpen(true)
  }, [])

  const handleDeleteAccount = useCallback((account: SortableAccount) => {
    setItemToDelete({ type: 'account', item: account })
    setDeleteDialogOpen(true)
  }, [])

  const handleEditAsset = useCallback((asset: SortableAsset) => {
    setEditingAsset(asset)
    setAssetDialogOpen(true)
  }, [])

  const handleDeleteAsset = useCallback((asset: SortableAsset) => {
    setItemToDelete({ type: 'asset', item: asset })
    setDeleteDialogOpen(true)
  }, [])

  const handleEditMutual = useCallback((mutual: Mutual) => {
    setEditingMutual(mutual)
    setMutualDialogOpen(true)
  }, [])

  const handleDeleteMutual = useCallback((mutual: Mutual) => {
    setItemToDelete({ type: 'mutual', item: mutual })
    setDeleteDialogOpen(true)
  }, [])

  // Dialog save handlers
  const handleSaveAccount = async (data: { title: string }) => {
    if (!user) return

    try {
      if (editingAccount) {
        // Update existing account
        await updateAccount(editingAccount.id, { title: data.title })
        // Update local state
        setAccounts(prev => prev.map(a => 
          a.id === editingAccount.id 
            ? { ...a, title: data.title } 
            : a
        ))
        toast.success('Account updated')
      } else {
        // Create new account
        const newAccount = await createAccount(data.title, user.uid)
        const accountWithUsers: SortableAccount = {
          ...newAccount,
          userNames: [user.displayName || 'You'],
          switched: false,
        }
        setAccounts(prev => [...prev, accountWithUsers])
        
        // Update user preferences to include new account
        const updatedAccounts: UserAccount[] = [
          ...(userPrefs?.accounts || []),
          { id: newAccount.id, switched: false }
        ]
        await updateUserPreference(user.uid, 'accounts', updatedAccounts)
        setUserPrefs(prev => prev ? { ...prev, accounts: updatedAccounts } : null)
        
        toast.success('Account created')
      }
    } catch (err) {
      logger.error('Error saving account:', err)
      toast.error('Failed to save account')
      throw err
    }
    
    setAccountDialogOpen(false)
    setEditingAccount(null)
  }

  const handleSaveAsset = async (data: {
    title: string
    accountId: string
    currency: string
    amount: number
    comment: string
  }) => {
    if (!user) return

    try {
      if (editingAsset) {
        // Update existing asset
        await updateAsset(editingAsset.accountId, editingAsset.id, {
          title: data.title,
          currency: data.currency,
          amount: data.amount,
          comment: data.comment,
        })
        // Update local state
        setAssets(prev => prev.map(a => 
          a.id === editingAsset.id 
            ? { ...a, title: data.title, currency: data.currency, amount: data.amount, comment: data.comment } 
            : a
        ))
        toast.success('Asset updated')
      } else {
        // Create new asset
        const newAsset = await createAsset(data.accountId, {
          title: data.title,
          currency: data.currency,
          amount: data.amount,
          comment: data.comment,
        })
        const assetWithHidden: SortableAsset = {
          ...newAsset,
          hidden: false,
        }
        setAssets(prev => [...prev, assetWithHidden])
        
        // Update user preferences to include new asset
        const updatedAssets: UserAsset[] = [
          ...(userPrefs?.assets || []),
          { id: newAsset.id, hide: false, index: assets.length }
        ]
        await updateUserPreference(user.uid, 'assets', updatedAssets)
        setUserPrefs(prev => prev ? { ...prev, assets: updatedAssets } : null)
        
        toast.success('Asset created')
      }
    } catch (err) {
      logger.error('Error saving asset:', err)
      toast.error('Failed to save asset')
      throw err
    }
    
    setAssetDialogOpen(false)
    setEditingAsset(null)
  }

  const handleSaveMutual = async (data: {
    title: string
    participants: { accountId: string; rate: number }[]
  }) => {
    if (!user) return

    try {
      if (editingMutual) {
        // Update existing mutual
        await updateMutual(editingMutual.id, data.title, data.participants)
        // Refetch mutual to get updated participants
        const updatedMutuals = await getMutualsByIds([editingMutual.id])
        if (updatedMutuals.length > 0) {
          setMutuals(prev => prev.map(m => 
            m.id === editingMutual.id ? updatedMutuals[0] : m
          ))
        }
        toast.success('Mutual updated')
      } else {
        // Create new mutual
        const newMutual = await createMutual(data.title, data.participants)
        setMutuals(prev => [...prev, newMutual])
        
        // Update user preferences to include new mutual
        const updatedMutuals: string[] = [
          ...(userPrefs?.mutuals || []),
          newMutual.id
        ]
        await updateUserPreference(user.uid, 'mutuals', updatedMutuals)
        setUserPrefs(prev => prev ? { ...prev, mutuals: updatedMutuals } : null)
        
        toast.success('Mutual created')
      }
    } catch (err) {
      logger.error('Error saving mutual:', err)
      toast.error('Failed to save mutual')
      throw err
    }
    
    setMutualDialogOpen(false)
    setEditingMutual(null)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !user) return

    const { type, item } = itemToDelete

    try {
      if (type === 'account') {
        const account = item as SortableAccount
        await deleteAccount(account.id)
        setAccounts(prev => prev.filter(a => a.id !== account.id))
        
        // Update user preferences
        const updatedAccounts = (userPrefs?.accounts || []).filter(a => a.id !== account.id)
        await updateUserPreference(user.uid, 'accounts', updatedAccounts)
        setUserPrefs(prev => prev ? { ...prev, accounts: updatedAccounts } : null)
        
        // Also remove assets that belonged to this account
        setAssets(prev => prev.filter(a => a.accountId !== account.id))
        
        toast.success('Account deleted')
      } else if (type === 'asset') {
        const asset = item as SortableAsset
        await deleteAsset(asset.accountId, asset.id)
        setAssets(prev => prev.filter(a => a.id !== asset.id))
        
        // Update user preferences
        const updatedAssets = (userPrefs?.assets || []).filter(a => a.id !== asset.id)
        await updateUserPreference(user.uid, 'assets', updatedAssets)
        setUserPrefs(prev => prev ? { ...prev, assets: updatedAssets } : null)
        
        toast.success('Asset deleted')
      } else if (type === 'mutual') {
        const mutual = item as Mutual
        await deleteMutual(mutual.id)
        setMutuals(prev => prev.filter(m => m.id !== mutual.id))
        
        // Update user preferences
        const updatedMutuals = (userPrefs?.mutuals || []).filter(m => m !== mutual.id)
        await updateUserPreference(user.uid, 'mutuals', updatedMutuals)
        setUserPrefs(prev => prev ? { ...prev, mutuals: updatedMutuals } : null)
        
        // Also remove purposes from this mutual
        setAllPurposes(prev => prev.filter(p => !mutual.purposes.find(mp => mp.id === p.id)))
        
        toast.success('Mutual deleted')
      }
    } catch (err) {
      logger.error(`Error deleting ${type}:`, err)
      toast.error(`Failed to delete ${type}`)
    }
    
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  // Build options for select dropdowns
  const mutualOptions: SelectOption[] = [
    { value: 'none', label: '— None —' },
    ...mutuals.map(m => ({ value: m.id, label: m.title }))
  ]

  const purposeOptions: SelectOption[] = [
    { value: 'none', label: '— None —' },
    ...allPurposes.map(p => ({ value: p.id, label: p.title }))
  ]

  const assetOptions: SelectOption[] = [
    { value: 'none', label: '— None —' },
    ...assets.filter(a => !a.hidden).map(a => ({ value: a.id, label: a.title }))
  ]

  const operationTypeOptions: SelectOption[] = [
    { value: 'none', label: '— None —' },
    { value: 'payment', label: 'Payment' },
    { value: 'income', label: 'Income' },
  ]

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

  const renderContent = () => {
    switch (viewMode) {
      case 'Accounts':
        return accounts.length > 0 ? (
          <SortableList
            items={accounts}
            onReorder={handleAccountsReorder}
            onEditItem={handleEditAccount}
            onDeleteItem={handleDeleteAccount}
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

      case 'Assets':
        return assetsLoading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading assets...</p>
          </div>
        ) : (
          <SortableList
            items={assets}
            onReorder={handleAssetsReorder}
            onEditItem={handleEditAsset}
            onDeleteItem={handleDeleteAsset}
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
        )

      case 'Mutuals':
        return mutualsLoading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading mutuals...</p>
          </div>
        ) : mutuals.length > 0 ? (
          <div className={styles.mutualsList}>
            {mutuals.map((mutual) => (
              <SwipeableItem
                key={mutual.id}
                onEdit={() => handleEditMutual(mutual)}
                onDelete={() => handleDeleteMutual(mutual)}
              >
                <div className={styles.mutualCard}>
                  <div className={styles.mutualIcon}>🤝</div>
                  <div className={styles.mutualInfo}>
                    <span className={styles.mutualTitle}>{mutual.title}</span>
                    <span className={styles.mutualDetails}>
                      {mutual.participants.length} participants · {mutual.purposes.length} purposes
                    </span>
                  </div>
                </div>
              </SwipeableItem>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🤝</span>
            <h3>No mutuals yet</h3>
            <p>You don't have any shared expense groups.</p>
          </div>
        )

      case 'Preferences':
        return (
          <div className={styles.preferencesPanel}>
            <div className={styles.preferenceGroup}>
              <label className={styles.preferenceLabel}>Default Mutual</label>
              <select
                className={styles.preferenceSelect}
                value={defaultMutualId}
                onChange={(e) => handlePreferenceChange('defaultMutualId', e.target.value)}
                disabled={isSavingPrefs}
              >
                {mutualOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.preferenceGroup}>
              <label className={styles.preferenceLabel}>Default Purpose</label>
              <select
                className={styles.preferenceSelect}
                value={defaultPurposeId}
                onChange={(e) => handlePreferenceChange('defaultPurposeId', e.target.value)}
                disabled={isSavingPrefs}
              >
                {purposeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.preferenceGroup}>
              <label className={styles.preferenceLabel}>Default Asset</label>
              <select
                className={styles.preferenceSelect}
                value={defaultAssetId}
                onChange={(e) => handlePreferenceChange('defaultAssetId', e.target.value)}
                disabled={isSavingPrefs || assetsLoading}
              >
                {assetOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.preferenceGroup}>
              <label className={styles.preferenceLabel}>Default Operation Type</label>
              <select
                className={styles.preferenceSelect}
                value={defaultOperationType}
                onChange={(e) => handlePreferenceChange('defaultOperationType', e.target.value)}
                disabled={isSavingPrefs}
              >
                {operationTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {isSavingPrefs && (
              <div className={styles.savingIndicator}>
                <div className={styles.smallSpinner}></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const handleAddAccount = () => {
    setEditingAccount(null)
    setAccountDialogOpen(true)
  }

  const handleAddAsset = () => {
    setEditingAsset(null)
    setAssetDialogOpen(true)
  }

  const handleAddMutual = () => {
    setEditingMutual(null)
    setMutualDialogOpen(true)
  }

  const renderAddButton = () => {
    switch (viewMode) {
      case 'Accounts':
        return (
          <button className={styles.addButton} onClick={handleAddAccount}>
            <span className={styles.addIcon}>+</span>
            Add Account
          </button>
        )
      case 'Assets':
        return (
          <button className={styles.addButton} onClick={handleAddAsset}>
            <span className={styles.addIcon}>+</span>
            Add Asset
          </button>
        )
      case 'Mutuals':
        return (
          <button className={styles.addButton} onClick={handleAddMutual}>
            <span className={styles.addIcon}>+</span>
            Add Mutual
          </button>
        )
      default:
        return null
    }
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
                accountsCount={userPrefs?.accounts?.length || 0}
                assetsVisibleCount={
                  assets.length > 0 
                    ? assets.filter(a => !a.hidden).length 
                    : (userPrefs?.assets?.filter(a => !a.hide).length || 0)
                }
                assetsTotalCount={
                  assets.length > 0 
                    ? assets.length 
                    : (userPrefs?.assets?.length || 0)
                }
                mutualsCount={userPrefs?.mutuals?.length || 0}
              />
            </div>
            {isReordering && <span className={styles.savingBadge}>Saving...</span>}
          </div>
          <div className={styles.scrollableList}>
            {renderContent()}
          </div>
          {viewMode !== 'Preferences' && (
            <div className={styles.addButtonContainer}>
              {renderAddButton()}
            </div>
          )}
        </section>
      </main>

      {/* Dialogs */}
      <AccountDialog
        isOpen={accountDialogOpen}
        account={editingAccount}
        onSave={handleSaveAccount}
        onCancel={() => {
          setAccountDialogOpen(false)
          setEditingAccount(null)
        }}
      />

      <AssetDialog
        isOpen={assetDialogOpen}
        asset={editingAsset}
        accounts={accounts}
        onSave={handleSaveAsset}
        onCancel={() => {
          setAssetDialogOpen(false)
          setEditingAsset(null)
        }}
      />

      <MutualDialog
        isOpen={mutualDialogOpen}
        mutual={editingMutual}
        accounts={accounts}
        onSave={handleSaveMutual}
        onCancel={() => {
          setMutualDialogOpen(false)
          setEditingMutual(null)
        }}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={`Delete ${itemToDelete?.type || 'item'}?`}
        message={`Are you sure you want to delete "${itemToDelete?.item.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setItemToDelete(null)
        }}
      />
    </div>
  )
}
