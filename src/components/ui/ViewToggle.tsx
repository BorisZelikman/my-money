import styles from './ViewToggle.module.css'

export type ViewMode = 'Accounts' | 'Assets'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.option} ${value === 'Accounts' ? styles.active : ''}`}
        onClick={() => onChange('Accounts')}
      >
        <span className={styles.icon}>💼</span>
        Accounts
      </button>
      <button
        className={`${styles.option} ${value === 'Assets' ? styles.active : ''}`}
        onClick={() => onChange('Assets')}
      >
        <span className={styles.icon}>💳</span>
        Assets
      </button>
    </div>
  )
}

