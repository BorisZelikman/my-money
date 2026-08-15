import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import type { Operation, MutualPurpose } from '@/types'
import { formatAmount } from '@/utils/currency'
import { getPurposeIcon } from '@/utils/icons'
import styles from './OperationsTable.module.css'

export interface OperationHistoryItem extends Operation {
  historyKey: string
  assetAccountId: string
  assetAccountTitle: string
  assetId: string
  assetTitle: string
  assetCurrency: string
}

interface OperationsTableProps {
  operations: OperationHistoryItem[]
  currency: string
  selectedKey?: string
  onSelect?: (operation: OperationHistoryItem) => void
  purposes?: MutualPurpose[]
  userNames?: Record<string, string>
  localAccountIds?: Set<string>
}

type SortColumn = 'date' | 'asset' | 'user' | 'title' | 'category' | 'amount'
type ColumnId = SortColumn
type SortDirection = 'asc' | 'desc'

const DEFAULT_COLUMN_ORDER: ColumnId[] = [
  'date',
  'asset',
  'user',
  'title',
  'category',
  'amount',
]
const COLUMN_ORDER_STORAGE_KEY = 'operations-table-column-order'

const COLUMN_LABELS: Record<ColumnId, string> = {
  date: 'Date',
  asset: 'Asset',
  user: 'User',
  title: 'Title',
  category: 'Category',
  amount: 'Amount',
}

interface SortState {
  column: SortColumn
  direction: SortDirection
}

function isExternalMutualOperation(
  operation: OperationHistoryItem,
  localAccountIds: Set<string>
) {
  return localAccountIds.size > 0 && !localAccountIds.has(operation.assetAccountId)
}

function getInitialColumnOrder(): ColumnId[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_COLUMN_ORDER
    const savedOrder = JSON.parse(
      localStorage.getItem(COLUMN_ORDER_STORAGE_KEY) || '[]'
    ) as string[]
    if (
      savedOrder.length === DEFAULT_COLUMN_ORDER.length &&
      DEFAULT_COLUMN_ORDER.every((column) => savedOrder.includes(column))
    ) {
      return savedOrder as ColumnId[]
    }
  } catch {
    // Ignore malformed local preferences and use the default order.
  }
  return DEFAULT_COLUMN_ORDER
}

interface SortableHeaderProps {
  column: ColumnId
  sort: SortState
  onSort: (column: SortColumn) => void
  onMove: (column: ColumnId, direction: -1 | 1) => void
}

function SortableHeader({ column, sort, onSort, onMove }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column })
  const isActive = sort.column === column
  const SortIcon = isActive
    ? sort.direction === 'asc' ? ArrowUp : ArrowDown
    : null

  return (
    <th
      ref={setNodeRef}
      className={`${column === 'amount' ? styles.amountCol : ''} ${isDragging ? styles.draggingHeader : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      aria-sort={isActive
        ? sort.direction === 'asc' ? 'ascending' : 'descending'
        : 'none'}
    >
      <div className={styles.headerContent}>
        <button
          type="button"
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          aria-label={`Move ${COLUMN_LABELS[column]} column`}
          title={`Drag to move ${COLUMN_LABELS[column]} column`}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            onMove(column, event.key === 'ArrowLeft' ? -1 : 1)
          }}
        >
          <GripVertical size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.sortButton} ${isActive ? styles.activeSort : ''}`}
          onClick={() => onSort(column)}
        >
          <span>{COLUMN_LABELS[column]}</span>
          {SortIcon && <SortIcon size={14} aria-hidden="true" />}
        </button>
      </div>
    </th>
  )
}

export function OperationsTable({
  operations,
  currency,
  selectedKey,
  onSelect,
  purposes = [],
  userNames = {},
  localAccountIds = new Set<string>(),
}: OperationsTableProps) {
  const selectedRowRef = useRef<HTMLTableRowElement>(null)
  const [sort, setSort] = useState<SortState>({
    column: 'date',
    direction: 'desc',
  })
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(getInitialColumnOrder)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )
  const showAssetColumn = new Set(
    operations
      .filter((operation) => !isExternalMutualOperation(operation, localAccountIds))
      .map((operation) => `${operation.assetAccountId}:${operation.assetId}`)
  ).size > 1
  const visibleColumns = columnOrder.filter(
    (column) => column !== 'asset' || showAssetColumn
  )

  useEffect(() => {
    if (!showAssetColumn && sort.column === 'asset') {
      setSort({ column: 'date', direction: 'desc' })
    }
  }, [showAssetColumn, sort.column])

  const sortedOperations = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1
    const getTextValue = (operation: OperationHistoryItem) => {
      switch (sort.column) {
        case 'asset':
          return isExternalMutualOperation(operation, localAccountIds)
            ? ''
            : `${operation.assetAccountTitle} ${operation.assetTitle}`
        case 'user':
          return userNames[operation.userId] || ''
        case 'title':
          return operation.title
        case 'category':
          return operation.category || ''
        default:
          return ''
      }
    }

    return operations
      .map((operation, index) => ({ operation, index }))
      .sort((first, second) => {
        let comparison = 0
        if (sort.column === 'date') {
          comparison = first.operation.datetime.toDate().getTime() -
            second.operation.datetime.toDate().getTime()
        } else if (sort.column === 'amount') {
          comparison = first.operation.amount - second.operation.amount
        } else {
          comparison = getTextValue(first.operation).localeCompare(
            getTextValue(second.operation),
            undefined,
            { sensitivity: 'base', numeric: true }
          )
        }

        return comparison === 0
          ? first.index - second.index
          : comparison * direction
      })
      .map(({ operation }) => operation)
  }, [localAccountIds, operations, sort, userNames])

  useEffect(() => {
    if (!selectedKey || !selectedRowRef.current) return
    const frame = requestAnimationFrame(() => {
      selectedRowRef.current?.scrollIntoView({
        block: 'center',
        inline: 'nearest',
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedKey, sortedOperations])

  const handleSort = (column: SortColumn) => {
    setSort((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc'
        ? 'desc'
        : 'asc',
    }))
  }

  const handleColumnDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    setColumnOrder((currentOrder) => {
      const oldIndex = currentOrder.indexOf(active.id as ColumnId)
      const newIndex = currentOrder.indexOf(over.id as ColumnId)
      if (oldIndex < 0 || newIndex < 0) return currentOrder

      const nextOrder = arrayMove(currentOrder, oldIndex, newIndex)
      try {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(nextOrder))
      } catch {
        // Reordering still works when local storage is unavailable.
      }
      return nextOrder
    })
  }

  const handleColumnMove = (column: ColumnId, direction: -1 | 1) => {
    setColumnOrder((currentOrder) => {
      const visibleOrder = currentOrder.filter(
        (currentColumn) => currentColumn !== 'asset' || showAssetColumn
      )
      const visibleIndex = visibleOrder.indexOf(column)
      const targetColumn = visibleOrder[visibleIndex + direction]
      if (!targetColumn) return currentOrder

      const nextOrder = arrayMove(
        currentOrder,
        currentOrder.indexOf(column),
        currentOrder.indexOf(targetColumn)
      )
      try {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(nextOrder))
      } catch {
        // Reordering still works when local storage is unavailable.
      }
      return nextOrder
    })
  }

  const formatDate = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getPurposeIconForOp = (purposeId?: string) => {
    if (!purposeId) return null
    const purpose = purposes.find((p) => p.id === purposeId)
    return getPurposeIcon(purpose?.icon)
  }

  const getAmountClass = (op: Operation) => {
    if (op.type === 'transfer') return styles.transfer
    if (op.type === 'payment') return styles.payment
    return styles.income
  }

  const getAmountPrefix = (op: Operation) => {
    if (op.type === 'transfer') {
      return op.settlementDirection === 'incoming' || op.loanDirection === 'incoming'
        ? '←'
        : '→'
    }
    return op.type === 'payment' ? '−' : '+'
  }

  const renderCell = (column: ColumnId, op: OperationHistoryItem) => {
    switch (column) {
      case 'date':
        return <td key={column} className={styles.date}>{formatDate(op.datetime)}</td>
      case 'asset':
        if (isExternalMutualOperation(op, localAccountIds)) {
          return (
            <td key={column} className={`${styles.asset} ${styles.hiddenAsset}`}>
              <span aria-label="External mutual asset">-</span>
            </td>
          )
        }
        return (
          <td
            key={column}
            className={styles.asset}
            title={`${op.assetAccountTitle} -> ${op.assetTitle}`}
          >
            <span className={styles.assetTitle}>{op.assetTitle}</span>
            <span className={styles.assetMeta}>{op.assetCurrency}</span>
          </td>
        )
      case 'user':
        return (
          <td key={column} className={styles.user}>
            {userNames[op.userId] || '-'}
          </td>
        )
      case 'title':
        return (
          <td key={column} className={styles.title}>
            <span className={styles.titleText}>
              {op.purposeId && (
                <span className={styles.purposeIcon}>
                  {getPurposeIconForOp(op.purposeId)}
                </span>
              )}
              {op.type === 'transfer' && (
                <span className={styles.transferIcon}>🔄</span>
              )}
              {op.title}
            </span>
            {op.comment && <span className={styles.comment}>{op.comment}</span>}
          </td>
        )
      case 'category':
        return (
          <td key={column}>
            <span className={`${styles.category} ${op.type === 'transfer' ? styles.transferCategory : ''}`}>
              {op.category || '-'}
            </span>
          </td>
        )
      case 'amount':
        return (
          <td key={column} className={`${styles.amount} ${getAmountClass(op)}`}>
            {getAmountPrefix(op)}
            {formatAmount(op.amount, op.assetCurrency || currency, {
              showSymbol: showAssetColumn,
            })}
          </td>
        )
    }
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleColumnDragEnd}
      >
        <table className={styles.table}>
          <thead>
            <SortableContext
              items={visibleColumns}
              strategy={horizontalListSortingStrategy}
            >
              <tr>
                {visibleColumns.map((column) => (
                  <SortableHeader
                    key={column}
                    column={column}
                    sort={sort}
                    onSort={handleSort}
                    onMove={handleColumnMove}
                  />
                ))}
              </tr>
            </SortableContext>
          </thead>
          <tbody>
            {sortedOperations.map((op) => (
              <tr
                key={op.historyKey}
                ref={selectedKey === op.historyKey ? selectedRowRef : undefined}
                className={`${styles.row} ${selectedKey === op.historyKey ? styles.selected : ''} ${op.type === 'transfer' ? styles.transferRow : ''} ${op.purposeId ? styles.sharedRow : ''} ${isExternalMutualOperation(op, localAccountIds) ? styles.mutualParticipantRow : ''}`}
                onClick={() => onSelect?.(op)}
              >
                {visibleColumns.map((column) => renderCell(column, op))}
              </tr>
            ))}
          </tbody>
        </table>
      </DndContext>
    </div>
  )
}

