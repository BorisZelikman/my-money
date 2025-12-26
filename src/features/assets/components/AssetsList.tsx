import type { Asset } from '@/types'
import { AssetCard } from './AssetCard'
import styles from './AssetsList.module.css'

interface AssetsListProps {
  assets: Asset[]
  onAssetClick?: (asset: Asset) => void
}

export function AssetsList({ assets, onAssetClick }: AssetsListProps) {
  if (assets.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>💳</span>
        <h3>No assets</h3>
        <p>You don't have any visible assets.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={onAssetClick}
        />
      ))}
    </div>
  )
}

