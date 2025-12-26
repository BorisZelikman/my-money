import type { SettlementData, Mutual } from '@/types'
import { formatAmount } from '@/utils/currency'
import styles from './SettlementSummary.module.css'

interface SettlementSummaryProps {
  settlements: SettlementData[]
  mutual: Mutual | null
}

export function SettlementSummary({ settlements, mutual }: SettlementSummaryProps) {
  if (!mutual || settlements.length === 0) return null

  const totalExpenses = settlements[0]?.totalExpenses || 0
  const totalRate = settlements.reduce((sum, s) => sum + s.rate, 0)

  // Find who owes and who is owed
  const debtors = settlements.filter((s) => s.owes > 0.01)
  const creditors = settlements.filter((s) => s.owes < -0.01)

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Settlement Summary</h2>

      <div className={styles.totalCard}>
        <span className={styles.totalIcon}>💰</span>
        <div className={styles.totalInfo}>
          <span className={styles.totalLabel}>Total Shared Expenses</span>
          <span className={styles.totalAmount}>
            {formatAmount(totalExpenses, 'ILS')}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {settlements.map((settlement) => (
          <div
            key={settlement.accountId}
            className={`${styles.card} ${
              settlement.owes > 0.01
                ? styles.owes
                : settlement.owes < -0.01
                ? styles.owed
                : styles.settled
            }`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.accountTitle}>{settlement.accountTitle}</span>
              <span className={styles.rate}>
                {settlement.rate}/{totalRate}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Expected</span>
                <span className={styles.statValue}>
                  {formatAmount(settlement.expectedShare, 'ILS')}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Actually Paid</span>
                <span className={styles.statValue}>
                  {formatAmount(settlement.actualPayments, 'ILS')}
                </span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              {settlement.owes > 0.01 ? (
                <>
                  <span className={styles.statusIcon}>📤</span>
                  <span className={styles.statusText}>
                    Owes {formatAmount(settlement.owes, 'ILS')}
                  </span>
                </>
              ) : settlement.owes < -0.01 ? (
                <>
                  <span className={styles.statusIcon}>📥</span>
                  <span className={styles.statusText}>
                    Is owed {formatAmount(Math.abs(settlement.owes), 'ILS')}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.statusIcon}>✅</span>
                  <span className={styles.statusText}>Settled</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {debtors.length > 0 && creditors.length > 0 && (
        <div className={styles.settlementAction}>
          <div className={styles.settlementInfo}>
            <span className={styles.settlementIcon}>🔄</span>
            <div className={styles.settlementText}>
              <strong>{debtors[0].accountTitle}</strong> should transfer{' '}
              <strong className={styles.settlementAmount}>
                {formatAmount(debtors[0].owes, 'ILS')}
              </strong>{' '}
              to <strong>{creditors[0].accountTitle}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

