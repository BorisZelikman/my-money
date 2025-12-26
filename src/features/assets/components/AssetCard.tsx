import type { Asset } from '@/types'
import { formatAmount } from '@/utils/currency'
import styles from './AssetCard.module.css'

interface AssetCardProps {
  asset: Asset
  onClick?: (asset: Asset) => void
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const isNegative = asset.amount < 0

  return (
    <div
      className={styles.card}
      onClick={() => onClick?.(asset)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.icon}>
        💳
      </div>
      <div className={styles.details}>
        <h4 className={styles.title}>{asset.title}</h4>
        {asset.comment && (
          <p className={styles.comment}>{asset.comment}</p>
        )}
      </div>
      <div className={`${styles.amount} ${isNegative ? styles.negative : styles.positive}`}>
        {formatAmount(asset.amount, asset.currency)}
      </div>
    </div>
  )
}

