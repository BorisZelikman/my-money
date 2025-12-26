import { formatAmount } from '@/utils/currency'
import styles from './TotalsSummary.module.css'

interface TotalsSummaryProps {
  income: number
  expenses: number
  transfers: number
  balance: number
  currency: string
}

export function TotalsSummary({
  income,
  expenses,
  transfers,
  balance,
  currency,
}: TotalsSummaryProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.income}`}>
        <span className={styles.icon}>💰</span>
        <div className={styles.details}>
          <span className={styles.label}>Income</span>
          <span className={styles.value}>
            +{formatAmount(income, currency)}
          </span>
        </div>
      </div>

      <div className={`${styles.card} ${styles.expenses}`}>
        <span className={styles.icon}>💸</span>
        <div className={styles.details}>
          <span className={styles.label}>Expenses</span>
          <span className={styles.value}>
            −{formatAmount(expenses, currency)}
          </span>
        </div>
      </div>

      {transfers > 0 && (
        <div className={`${styles.card} ${styles.transfers}`}>
          <span className={styles.icon}>🔄</span>
          <div className={styles.details}>
            <span className={styles.label}>Transfers</span>
            <span className={styles.value}>
              {formatAmount(transfers, currency)}
            </span>
          </div>
        </div>
      )}

      <div className={`${styles.card} ${styles.balance} ${balance >= 0 ? styles.positive : styles.negative}`}>
        <span className={styles.icon}>{balance >= 0 ? '📈' : '📉'}</span>
        <div className={styles.details}>
          <span className={styles.label}>Balance</span>
          <span className={styles.value}>
            {balance >= 0 ? '+' : ''}{formatAmount(balance, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

