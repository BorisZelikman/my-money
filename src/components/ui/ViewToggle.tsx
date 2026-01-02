import styles from './ViewToggle.module.css'

export type ViewMode = 'Accounts' | 'Assets'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  accountsCount?: number
  assetsVisibleCount?: number
  assetsTotalCount?: number
}

export function ViewToggle({ 
  value, 
  onChange, 
  accountsCount,
  assetsVisibleCount,
  assetsTotalCount,
}: ViewToggleProps) {
  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.option} ${value === 'Accounts' ? styles.active : ''}`}
        onClick={() => onChange('Accounts')}
      >
        <span className={styles.icon}>💼</span>
        Accounts
        {accountsCount !== undefined && (
          <span className={styles.count}>{accountsCount}</span>
        )}
      </button>
      <button
        className={`${styles.option} ${value === 'Assets' ? styles.active : ''}`}
        onClick={() => onChange('Assets')}
      >
        <span className={styles.icon}>💳</span>
        Assets
        {assetsVisibleCount !== undefined && assetsTotalCount !== undefined && (
          <span className={styles.count}>{assetsVisibleCount}/{assetsTotalCount}</span>
        )}
      </button>
    </div>
  )
}
