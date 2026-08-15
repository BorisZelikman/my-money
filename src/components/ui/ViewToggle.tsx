import styles from './ViewToggle.module.css'
import { useTranslation } from 'react-i18next'

export type ViewMode = 'Accounts' | 'Assets' | 'Mutuals' | 'Categories' | 'Preferences'

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
  categoriesCount?: number
}

export function ViewToggle({ 
  value, 
  onChange, 
  accountsCount,
  assetsVisibleCount,
  assetsTotalCount,
  mutualsCount,
  categoriesCount,
}: ViewToggleProps) {
  const { t } = useTranslation()
  const tabs: TabConfig[] = [
    { 
      mode: 'Accounts', 
      icon: '💼', 
      label: t('profile.accounts'),
      count: accountsCount,
    },
    { 
      mode: 'Assets', 
      icon: '💳', 
      label: t('profile.assets'),
      count: assetsVisibleCount !== undefined && assetsTotalCount !== undefined 
        ? `${assetsVisibleCount}/${assetsTotalCount}` 
        : undefined,
    },
    {
      mode: 'Mutuals',
      icon: '🤝', 
      label: t('profile.mutuals'),
      count: mutualsCount,
    },
    {
      mode: 'Categories',
      icon: '🏷️',
      label: t('profile.categories'),
      count: categoriesCount,
    },
    { 
      mode: 'Preferences', 
      icon: '⚙️', 
      label: t('profile.settings'),
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
