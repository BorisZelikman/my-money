import type { Operation, MutualPurpose } from '@/types'
import { formatAmount } from '@/utils/currency'
import styles from './OperationsTable.module.css'

interface OperationsTableProps {
  operations: Operation[]
  currency: string
  selectedId?: string
  onSelect?: (operation: Operation) => void
  purposes?: MutualPurpose[]
  userNames?: Record<string, string>
}

export function OperationsTable({
  operations,
  currency,
  selectedId,
  onSelect,
  purposes = [],
  userNames = {},
}: OperationsTableProps) {
  const formatDate = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getPurposeIcon = (purposeId?: string) => {
    if (!purposeId) return null
    const purpose = purposes.find((p) => p.id === purposeId)
    return purpose?.icon || '🤝'
  }

  const getAmountClass = (op: Operation) => {
    if (op.type === 'transfer') return styles.transfer
    if (op.type === 'payment') return styles.payment
    return styles.income
  }

  const getAmountPrefix = (op: Operation) => {
    if (op.type === 'transfer') {
      // Outgoing transfer (has transferTo pointing elsewhere)
      return op.transferTo ? '→' : '←'
    }
    return op.type === 'payment' ? '−' : '+'
  }

  if (operations.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <h3>No operations</h3>
        <p>No operations match the current filter.</p>
      </div>
    )
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Title</th>
            <th>Category</th>
            <th className={styles.amountCol}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op) => (
            <tr
              key={op.id}
              className={`${styles.row} ${selectedId === op.id ? styles.selected : ''} ${op.type === 'transfer' ? styles.transferRow : ''} ${op.purposeId ? styles.sharedRow : ''}`}
              onClick={() => onSelect?.(op)}
            >
              <td className={styles.date}>{formatDate(op.datetime)}</td>
              <td className={styles.user}>{userNames[op.userId] || '—'}</td>
              <td className={styles.title}>
                <span className={styles.titleText}>
                  {op.purposeId && <span className={styles.purposeIcon}>{getPurposeIcon(op.purposeId)}</span>}
                  {op.type === 'transfer' && <span className={styles.transferIcon}>🔄</span>}
                  {op.title}
                </span>
                {op.comment && (
                  <span className={styles.comment}>{op.comment}</span>
                )}
              </td>
              <td>
                <span className={`${styles.category} ${op.type === 'transfer' ? styles.transferCategory : ''}`}>
                  {op.category || '—'}
                </span>
              </td>
              <td className={`${styles.amount} ${getAmountClass(op)}`}>
                {getAmountPrefix(op)}
                {formatAmount(op.amount, currency, { showSymbol: false })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

