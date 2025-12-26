import type { MutualOperation } from '@/types'
import { formatAmount } from '@/utils/currency'
import { getPurposeIcon } from '@/utils/icons'
import styles from './MutualOperationsTable.module.css'

interface MutualOperationsTableProps {
  operations: MutualOperation[]
}

export function MutualOperationsTable({ operations }: MutualOperationsTableProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  if (operations.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🤝</span>
        <h3>No shared operations</h3>
        <p>No operations match the selected filters.</p>
      </div>
    )
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Account</th>
            <th>User</th>
            <th>Purpose</th>
            <th>Title</th>
            <th>Category</th>
            <th className={styles.amountCol}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op) => (
            <tr key={`${op.accountId}-${op.assetId}-${op.id}`} className={styles.row}>
              <td className={styles.date}>{formatDate(op.datetime)}</td>
              <td className={styles.account}>{op.accountTitle}</td>
              <td className={styles.user}>{op.userName}</td>
              <td>
                <span className={styles.purpose}>
                  <span className={styles.purposeIcon}>{getPurposeIcon(op.purposeIcon)}</span>
                  {op.purposeTitle}
                </span>
              </td>
              <td className={styles.title}>
                <span className={styles.titleText}>{op.title}</span>
                {op.comment && (
                  <span className={styles.comment}>{op.comment}</span>
                )}
              </td>
              <td>
                <span className={styles.category}>{op.category || '—'}</span>
              </td>
              <td className={`${styles.amount} ${op.type === 'payment' ? styles.payment : styles.income}`}>
                {op.type === 'payment' ? '−' : '+'}
                {formatAmount(op.amount, 'ILS', { showSymbol: false })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

