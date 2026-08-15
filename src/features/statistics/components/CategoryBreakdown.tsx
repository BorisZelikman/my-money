import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ListTree,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Category } from '@/types'
import { formatAmount } from '@/utils/currency'
import type { LocatedOperation } from '../types'
import {
  buildCategoryTree,
  findCategoryNode,
} from '../utils/categoryAnalytics'
import styles from './StatisticsPage.module.css'

interface CategoryBreakdownProps {
  operations: LocatedOperation[]
  categories: Category[]
  currency: string
  dayCount: number | null
  editableAccountIds: Set<string>
}

export function CategoryBreakdown({
  operations,
  categories,
  currency,
  dayCount,
  editableAccountIds,
}: CategoryBreakdownProps) {
  const navigate = useNavigate()
  const [path, setPath] = useState<string[]>([])
  const tree = useMemo(
    () => buildCategoryTree(operations, categories),
    [categories, operations]
  )
  const current = findCategoryNode(tree, path) || tree
  const selected = path.length > 0
  const maximum = current.children[0]?.activity || 0
  const shownOperations = useMemo(
    () => [...current.operations].sort(
      (first, second) => second.datetime.toMillis() - first.datetime.toMillis()
    ),
    [current.operations]
  )
  useEffect(() => {
    if (path.length && !findCategoryNode(tree, path)) setPath([])
  }, [path, tree])

  return (
    <section className={`${styles.panel} ${styles.categoryPanel}`}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Categories</h2>
          <p>{selected
            ? `${current.count} ${current.count === 1 ? 'operation' : 'operations'} in this branch`
            : 'Income and expenses in one hierarchy'}</p>
        </div>
        <ListTree aria-hidden="true" />
      </div>

      {tree.count === 0 ? (
        <div className={styles.panelEmpty}>
          No categorized income or expenses in this period.
        </div>
      ) : (
        <>
          <div className={styles.categoryNavigation}>
            <button
              type="button"
              className={styles.categoryBack}
              onClick={() => setPath((currentPath) => currentPath.slice(0, -1))}
              aria-label="Back to parent category"
              aria-hidden={!selected}
              disabled={!selected}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <div className={styles.categoryBreadcrumbs}>
              <button type="button" onClick={() => setPath([])}>All</button>
              {path.map((key, index) => {
                const node = findCategoryNode(tree, path.slice(0, index + 1))
                return node ? (
                  <span key={`${key}-${index}`}>
                    <ChevronRight aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setPath(path.slice(0, index + 1))}
                    >
                      {node.title}
                    </button>
                  </span>
                ) : null
              })}
            </div>
            <div className={styles.categorySelectionTotal}>
              <span className={styles.categoryIncome}>Income {formatAmount(current.income, currency)}</span>
              <span className={styles.categoryExpense}>Expenses {formatAmount(current.expenses, currency)}</span>
              <strong className={current.net >= 0 ? styles.categoryIncome : styles.categoryExpense}>
                Net {current.net >= 0 ? '+' : ''}{formatAmount(current.net, currency)}
              </strong>
              {dayCount && (
                <span>{formatAmount(current.activity / dayCount, currency)} activity / day</span>
              )}
            </div>
          </div>

          <div className={styles.categoryContent}>
            {current.children.length > 0 && (
              <div className={styles.categoryList}>
                {current.children.map((category) => (
                  <button
                    type="button"
                    className={styles.categoryRow}
                    key={category.key}
                    onClick={() => setPath((currentPath) => [...currentPath, category.key])}
                  >
                    <div className={styles.categoryInfo}>
                      <span title={category.title}>{category.title}</span>
                      <span className={styles.categoryAmounts}>
                        {category.income > 0 && (
                          <strong className={styles.categoryIncome}>
                            +{formatAmount(category.income, currency)}
                          </strong>
                        )}
                        {category.expenses > 0 && (
                          <strong className={styles.categoryExpense}>
                            -{formatAmount(category.expenses, currency)}
                          </strong>
                        )}
                        <strong className={category.net >= 0 ? styles.categoryIncome : styles.categoryExpense}>
                          Net {category.net >= 0 ? '+' : ''}{formatAmount(category.net, currency)}
                        </strong>
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <span style={{
                        width: `${Math.max(2, (category.activity / maximum) * 100)}%`,
                      }} />
                    </div>
                    <span className={styles.categoryMeta}>
                      {current.activity > 0
                        ? `${Math.round((category.activity / current.activity) * 100)}%`
                        : '0%'}
                      {' / '}{category.count} {category.count === 1 ? 'operation' : 'operations'}
                      <ChevronRight aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className={styles.categoryOperations}>
                <h3>Operations</h3>
                {shownOperations.map((operation) => {
                  const canEdit = editableAccountIds.has(operation.accountId)
                  const content = (
                    <>
                      <time>{operation.datetime.toDate().toLocaleDateString('en-GB')}</time>
                      <span title={operation.title}>{operation.title}</span>
                      <strong className={operation.type === 'income'
                        ? styles.categoryIncome
                        : styles.categoryExpense}>
                        {operation.type === 'income' ? '+' : '-'}
                        {formatAmount(operation.amount, currency)}
                      </strong>
                    </>
                  )
                  const key = `${operation.accountId}-${operation.assetId}-${operation.id}`
                  return canEdit ? (
                    <button
                      type="button"
                      className={`${styles.categoryOperation} ${styles.categoryOperationLink}`}
                      key={key}
                      onClick={() => navigate(
                        `/operations?accountId=${encodeURIComponent(operation.accountId)}` +
                        `&assetId=${encodeURIComponent(operation.assetId)}` +
                        `&operationId=${encodeURIComponent(operation.id)}`
                      )}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={styles.categoryOperation} key={key}>
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
