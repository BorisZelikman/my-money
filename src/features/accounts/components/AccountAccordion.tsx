import { useState, useEffect } from 'react'
import type { AccountWithUsers, Asset } from '@/types'
import { getAssetsByAccountId } from '@/features/assets/services/assetService'
import { AssetCard } from '@/features/assets/components/AssetCard'
import { formatAmount } from '@/utils/currency'
import { logger } from '@/utils/logger'
import styles from './AccountAccordion.module.css'

interface AccountAccordionProps {
  account: AccountWithUsers
  defaultExpanded?: boolean
  onAssetClick?: (asset: Asset) => void
  embedded?: boolean
}

export function AccountAccordion({
  account,
  defaultExpanded = false,
  onAssetClick,
  embedded = false,
}: AccountAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    async function loadAssets() {
      if (isExpanded && !hasLoaded) {
        setIsLoading(true)
        try {
          const data = await getAssetsByAccountId(account.id)
          setAssets(data)
          setHasLoaded(true)
        } catch (error) {
          logger.error('Error loading assets', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadAssets()
  }, [isExpanded, hasLoaded, account.id])

  // Group assets by currency and calculate totals
  const totalsByCurrency = assets.reduce((acc, asset) => {
    if (!acc[asset.currency]) {
      acc[asset.currency] = 0
    }
    acc[asset.currency] += asset.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={`${styles.accordion} ${embedded ? styles.embedded : ''}`}>
      <button
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          <span className={styles.icon}>💼</span>
          <div className={styles.headerInfo}>
            <h3 className={styles.title}>{account.title}</h3>
            <p className={styles.users}>
              {account.userNames.join(', ')}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {hasLoaded && (
            <div className={styles.totals}>
              {Object.entries(totalsByCurrency).map(([currency, total]) => (
                <span
                  key={currency}
                  className={`${styles.total} ${total < 0 ? styles.negative : ''}`}
                >
                  {formatAmount(total, currency)}
                </span>
              ))}
            </div>
          )}
          <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Loading assets...</span>
            </div>
          ) : assets.length > 0 ? (
            <div className={styles.assetsList}>
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={onAssetClick}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <span>📭</span>
              <p>No assets in this account</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

