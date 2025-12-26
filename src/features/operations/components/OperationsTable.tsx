import type { Operation } from '@/types'
import { formatAmount } from '@/utils/currency'
import styles from './OperationsTable.module.css'

interface OperationsTableProps {
  operations: Operation[]
  currency: string
  selectedId?: string
  onSelect?: (operation: Operation) => void
}

export function OperationsTable({
  operations,
  currency,
  selectedId,
  onSelect,
}: OperationsTableProps) {
  const formatDate = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (operations.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <h3>No operations yet</h3>
        <p>Add your first operation to get started.</p>
      </div>
    )
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Category</th>
            <th className={styles.amountCol}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op) => (
            <tr
              key={op.id}
              className={`${styles.row} ${selectedId === op.id ? styles.selected : ''}`}
              onClick={() => onSelect?.(op)}
            >
              <td className={styles.date}>{formatDate(op.datetime)}</td>
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
                {formatAmount(op.amount, currency, { showSymbol: false })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

