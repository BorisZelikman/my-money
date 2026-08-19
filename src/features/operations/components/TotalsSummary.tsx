import { formatAmount } from '@/utils/currency'
import styles from './TotalsSummary.module.css'
import { useTranslation } from 'react-i18next'

interface TotalsSummaryProps {
  income: number
  expenses: number
  transfers: number
  balance: number
  currency: string
  loanDebt?: {
    label: 'Owes' | 'You owe'
    amount: number
  } | null
  compact?: boolean
  inline?: boolean
}

export function TotalsSummary({
  income,
  expenses,
  transfers,
  balance,
  currency,
  loanDebt,
  compact = false,
  inline = false,
}: TotalsSummaryProps) {
  const { t } = useTranslation()
  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${inline ? styles.inline : ''}`}>
      <div className={`${styles.card} ${styles.income}`}>
        <span className={styles.icon}>💰</span>
        <div className={styles.details}>
          <span className={styles.label}>{t('common.income')}</span>
          <span className={styles.value}>
            +{formatAmount(income, currency)}
          </span>
        </div>
      </div>

      <div className={`${styles.card} ${styles.expenses}`}>
        <span className={styles.icon}>💸</span>
        <div className={styles.details}>
          <span className={styles.label}>{t('common.expenses')}</span>
          <span className={styles.value}>
            −{formatAmount(expenses, currency)}
          </span>
        </div>
      </div>

      {loanDebt ? (
        <div className={`${styles.card} ${styles.transfers}`}>
          <span className={styles.icon}>🤝</span>
          <div className={styles.details}>
            <span className={styles.label}>
              {loanDebt.label === 'Owes' ? t('operations.owes') : t('statistics.youOwe')}
            </span>
            <span className={styles.value}>
              {formatAmount(loanDebt.amount, currency)}
            </span>
          </div>
        </div>
      ) : transfers > 0 ? (
        <div className={`${styles.card} ${styles.transfers}`}>
          <span className={styles.icon}>🔄</span>
          <div className={styles.details}>
            <span className={styles.label}>{t('common.transfers')}</span>
            <span className={styles.value}>
              {formatAmount(transfers, currency)}
            </span>
          </div>
        </div>
      ) : null}

      <div className={`${styles.card} ${styles.balance} ${balance >= 0 ? styles.positive : styles.negative}`}>
        <span className={styles.icon}>{balance >= 0 ? '📈' : '📉'}</span>
        <div className={styles.details}>
          <span className={styles.label}>{t('common.balance')}</span>
          <span className={styles.value}>
            {balance >= 0 ? '+' : ''}{formatAmount(balance, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

