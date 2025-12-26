import type { AccountWithUsers } from '@/types'
import styles from './AccountsList.module.css'

interface AccountsListProps {
  accounts: AccountWithUsers[]
  onAccountClick?: (accountId: string) => void
}

export function AccountsList({ accounts, onAccountClick }: AccountsListProps) {
  return (
    <div className={styles.list}>
      {accounts.map((account) => (
        <div
          key={account.id}
          className={styles.card}
          onClick={() => onAccountClick?.(account.id)}
          role={onAccountClick ? 'button' : undefined}
          tabIndex={onAccountClick ? 0 : undefined}
        >
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>💼</span>
            </div>
            <div className={styles.details}>
              <h3 className={styles.title}>{account.title}</h3>
              <p className={styles.users}>
                <span className={styles.usersIcon}>👥</span>
                {account.userNames.join(', ')}
              </p>
            </div>
          </div>
          <div className={styles.cardArrow}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}

