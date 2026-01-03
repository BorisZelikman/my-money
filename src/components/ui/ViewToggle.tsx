import styles from './ViewToggle.module.css'

export type ViewMode = 'Accounts' | 'Assets' | 'Mutuals' | 'Preferences'

interface TabConfig {
  mode: ViewMode
  icon: string
  label: string
  count?: string | number
}

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  accountsCount?: number
  assetsVisibleCount?: number
  assetsTotalCount?: number
  mutualsCount?: number
}

export function ViewToggle({ 
  value, 
  onChange, 
  accountsCount,
  assetsVisibleCount,
  assetsTotalCount,
  mutualsCount,
}: ViewToggleProps) {
  const tabs: TabConfig[] = [
    { 
      mode: 'Accounts', 
      icon: '💼', 
      label: 'Accounts',
      count: accountsCount,
    },
    { 
      mode: 'Assets', 
      icon: '💳', 
      label: 'Assets',
      count: assetsVisibleCount !== undefined && assetsTotalCount !== undefined 
        ? `${assetsVisibleCount}/${assetsTotalCount}` 
        : undefined,
    },
    { 
      mode: 'Mutuals', 
      icon: '🤝', 
      label: 'Mutuals',
      count: mutualsCount,
    },
    { 
      mode: 'Preferences', 
      icon: '⚙️', 
      label: 'Settings',
    },
  ]

  return (
    <div className={styles.toggle}>
      {tabs.map((tab) => (
        <button
          key={tab.mode}
          className={`${styles.option} ${value === tab.mode ? styles.active : ''}`}
          onClick={() => onChange(tab.mode)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={styles.count}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
