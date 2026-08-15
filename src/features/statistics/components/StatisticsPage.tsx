import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  CircleDollarSign,
  HandCoins,
  Minus,
  ReceiptText,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  LoaderCircle,
  WalletCards,
} from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { DateRangePicker, type DateRange } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { getAllAssetsForAccounts } from '@/features/assets/services/assetService'
import { getLoanLedger } from '@/features/mutuals/services/loanService'
import {
  getMutualOperations,
  getMutualsByIds,
} from '@/features/mutuals/services/mutualService'
import {
  getOperationsByAssetId,
  getOperationsByDateRange,
} from '@/features/operations/services/operationService'
import { getUserPreferences } from '@/features/profile/services/userService'
import { getCategories } from '@/features/categories'
import type { Asset, Category, LoanLedger, Operation } from '@/types'
import { formatAmount } from '@/utils/currency'
import { logger } from '@/utils/logger'
import styles from './StatisticsPage.module.css'

interface LocatedOperation extends Operation {
  accountId: string
  assetId: string
}

interface PeriodTotals {
  income: number
  expenses: number
  net: number
  operationCount: number
}

interface CategoryTotal {
  name: string
  amount: number
  count: number
}

interface CashFlowPoint {
  key: string
  label: string
  fullLabel: string
  income: number
  expenses: number
  net: number
}

function getCurrentMonthRange(): DateRange {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  }
}

function getPreviousRange(range: DateRange | null): DateRange | null {
  if (!range) return null

  const startsAtCalendarYear = range.from.getMonth() === 0 &&
    range.from.getDate() === 1 &&
    range.from.getFullYear() === range.to.getFullYear()
  if (startsAtCalendarYear) {
    return {
      from: new Date(range.from.getFullYear() - 1, 0, 1),
      to: new Date(
        range.to.getFullYear() - 1,
        range.to.getMonth(),
        range.to.getDate(),
        range.to.getHours(),
        range.to.getMinutes(),
        range.to.getSeconds(),
        range.to.getMilliseconds()
      ),
    }
  }

  const startsAtCalendarMonth = range.from.getDate() === 1 &&
    range.from.getFullYear() === range.to.getFullYear() &&
    range.from.getMonth() === range.to.getMonth()
  if (startsAtCalendarMonth) {
    const previousMonthStart = new Date(
      range.from.getFullYear(),
      range.from.getMonth() - 1,
      1
    )
    const previousMonthLastDay = new Date(
      range.from.getFullYear(),
      range.from.getMonth(),
      0
    ).getDate()
    return {
      from: previousMonthStart,
      to: new Date(
        previousMonthStart.getFullYear(),
        previousMonthStart.getMonth(),
        Math.min(range.to.getDate(), previousMonthLastDay),
        range.to.getHours(),
        range.to.getMinutes(),
        range.to.getSeconds(),
        range.to.getMilliseconds()
      ),
    }
  }

  const duration = Math.max(0, range.to.getTime() - range.from.getTime())
  const to = new Date(range.from.getTime() - 1)
  return { from: new Date(to.getTime() - duration), to }
}

function isFinancialOperation(operation: Operation) {
  return (operation.type === 'payment' || operation.type === 'income') &&
    !operation.settlementId &&
    !operation.loanEntryId
}

function calculatePeriodTotals(operations: LocatedOperation[]): PeriodTotals {
  return operations.reduce<PeriodTotals>((totals, operation) => {
    if (!isFinancialOperation(operation)) return totals
    const amount = Number(operation.amount) || 0
    if (operation.type === 'income') totals.income += amount
    if (operation.type === 'payment') totals.expenses += amount
    totals.net = totals.income - totals.expenses
    totals.operationCount += 1
    return totals
  }, { income: 0, expenses: 0, net: 0, operationCount: 0 })
}

function getRootCategory(operation: LocatedOperation, categories: Category[]) {
  const accountCategories = categories.filter((category) =>
    category.accountId === operation.accountId
  )
  const byId = new Map(accountCategories.map((category) => [category.id, category]))
  let category = operation.categoryId
    ? byId.get(operation.categoryId)
    : accountCategories.find((item) =>
      item.title.toLocaleLowerCase() === operation.category?.trim().toLocaleLowerCase()
    )
  const visited = new Set<string>()
  while (category?.parentCategoryId && !visited.has(category.id)) {
    visited.add(category.id)
    category = byId.get(category.parentCategoryId) || category
    if (!category.parentCategoryId) break
  }
  return category?.title || operation.category?.trim() || 'Uncategorized'
}

function calculateCategories(
  operations: LocatedOperation[],
  categoryDefinitions: Category[]
): CategoryTotal[] {
  const grouped = new Map<string, CategoryTotal>()
  for (const operation of operations) {
    if (operation.type !== 'payment' || !isFinancialOperation(operation)) continue
    const name = getRootCategory(operation, categoryDefinitions)
    const current = grouped.get(name) || { name, amount: 0, count: 0 }
    current.amount += Number(operation.amount) || 0
    current.count += 1
    grouped.set(name, current)
  }
  return [...grouped.values()].sort((a, b) => b.amount - a.amount)
}

function getLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getLocalMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-')
}

function buildCashFlowSeries(
  operations: LocatedOperation[],
  range: DateRange | null
) {
  const financialOperations = operations.filter(isFinancialOperation)
  const earliestTime = financialOperations.reduce(
    (earliest, operation) => Math.min(
      earliest,
      operation.datetime.toDate().getTime()
    ),
    Number.POSITIVE_INFINITY
  )
  if (!range && !Number.isFinite(earliestTime)) {
    return { points: [] as CashFlowPoint[], granularity: 'day' as const }
  }

  const startSource = range?.from || new Date(earliestTime)
  const endSource = range?.to || new Date()
  const approximateDays = Math.max(
    1,
    Math.ceil((endSource.getTime() - startSource.getTime()) / 86_400_000)
  )
  const granularity = approximateDays <= 62 ? 'day' as const : 'month' as const
  const grouped = new Map<string, Pick<CashFlowPoint, 'income' | 'expenses'>>()

  for (const operation of financialOperations) {
    const operationDate = operation.datetime.toDate()
    const key = granularity === 'day'
      ? getLocalDateKey(operationDate)
      : getLocalMonthKey(operationDate)
    const current = grouped.get(key) || { income: 0, expenses: 0 }
    if (operation.type === 'income') current.income += Number(operation.amount) || 0
    if (operation.type === 'payment') current.expenses += Number(operation.amount) || 0
    grouped.set(key, current)
  }

  const cursor = granularity === 'day'
    ? new Date(startSource.getFullYear(), startSource.getMonth(), startSource.getDate())
    : new Date(startSource.getFullYear(), startSource.getMonth(), 1)
  const end = granularity === 'day'
    ? new Date(endSource.getFullYear(), endSource.getMonth(), endSource.getDate())
    : new Date(endSource.getFullYear(), endSource.getMonth(), 1)
  const shortFormatter = new Intl.DateTimeFormat('en-GB', granularity === 'day'
    ? { day: 'numeric', month: 'short' }
    : { month: 'short', year: '2-digit' })
  const fullFormatter = new Intl.DateTimeFormat('en-GB', granularity === 'day'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { month: 'long', year: 'numeric' })
  const points: CashFlowPoint[] = []

  while (cursor <= end) {
    const key = granularity === 'day'
      ? getLocalDateKey(cursor)
      : getLocalMonthKey(cursor)
    const values = grouped.get(key) || { income: 0, expenses: 0 }
    points.push({
      key,
      label: shortFormatter.format(cursor),
      fullLabel: fullFormatter.format(cursor),
      income: values.income,
      expenses: values.expenses,
      net: values.income - values.expenses,
    })
    if (granularity === 'day') cursor.setDate(cursor.getDate() + 1)
    else cursor.setMonth(cursor.getMonth() + 1)
  }

  return { points, granularity }
}

function getPeriodLabel(range: DateRange | null) {
  if (!range) return 'All time'
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${formatter.format(range.from)} - ${formatter.format(range.to)}`
}

function getDaysInRange(
  range: DateRange | null,
  operations: LocatedOperation[]
) {
  if (range) {
    return Math.max(1, Math.ceil(
      (range.to.getTime() - range.from.getTime()) / 86_400_000
    ))
  }

  const earliestOperationTime = operations.reduce((earliest, operation) => {
    if (!isFinancialOperation(operation)) return earliest
    return Math.min(earliest, operation.datetime.toDate().getTime())
  }, Number.POSITIVE_INFINITY)
  if (!Number.isFinite(earliestOperationTime)) return null

  const earliestDate = new Date(earliestOperationTime)
  const firstDay = new Date(
    earliestDate.getFullYear(),
    earliestDate.getMonth(),
    earliestDate.getDate()
  )
  return Math.max(1, Math.ceil((Date.now() - firstDay.getTime()) / 86_400_000))
}

function getChange(current: number, previous?: number) {
  if (previous === undefined || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

interface MetricProps {
  label: string
  value: string
  previousValue?: number
  currentValue?: number
  tone: 'income' | 'expense' | 'net' | 'loan'
  inverseTrend?: boolean
  icon: typeof CircleDollarSign
  detail?: string
}

function Metric({
  label,
  value,
  previousValue,
  currentValue,
  tone,
  inverseTrend = false,
  icon: Icon,
  detail,
}: MetricProps) {
  const change = currentValue === undefined
    ? null
    : getChange(currentValue, previousValue)
  const improving = change === null || change === 0
    ? null
    : inverseTrend ? change < 0 : change > 0
  const TrendIcon = change === null || change === 0
    ? Minus
    : change > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <article className={`${styles.metric} ${styles[tone]}`}>
      <div className={styles.metricIcon}><Icon aria-hidden="true" /></div>
      <div className={styles.metricBody}>
        <span className={styles.metricLabel}>{label}</span>
        <strong>{value}</strong>
        {detail && <span className={styles.metricDetail}>{detail}</span>}
      </div>
      {change !== null && (
        <span
          className={`${styles.trend} ${
            improving === null ? styles.neutralTrend :
              improving ? styles.goodTrend : styles.badTrend
          }`}
          title="Compared with the previous period"
        >
          <TrendIcon aria-hidden="true" />
          {Math.abs(change).toFixed(0)}%
        </span>
      )}
    </article>
  )
}

interface CashFlowChartProps {
  points: CashFlowPoint[]
  granularity: 'day' | 'month'
  currency: string
}

function CashFlowChart({ points, granularity, currency }: CashFlowChartProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const maximum = Math.max(1, ...points.map((point) => Math.abs(point.net)))
  const selected = points.find((point) => point.key === selectedKey) ||
    [...points].reverse().find((point) => point.income || point.expenses) ||
    points[points.length - 1]

  useEffect(() => {
    const lastActivePoint = [...points].reverse().find(
      (point) => point.income || point.expenses
    )
    setSelectedKey(lastActivePoint?.key || points[points.length - 1]?.key || null)
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollLeft = scroller.scrollWidth
  }, [points])

  return (
    <section className={styles.cashFlowPanel}>
      <div className={styles.cashFlowHeading}>
        <div>
          <h2>{granularity === 'day' ? 'Daily' : 'Monthly'} cash flow</h2>
          <p>Net income after expenses</p>
        </div>
        <div className={styles.cashFlowLegend} aria-label="Cash flow legend">
          <span><i className={styles.positiveLegend} />Positive</span>
          <span><i className={styles.negativeLegend} />Negative</span>
        </div>
      </div>

      {points.length === 0 ? (
        <div className={styles.panelEmpty}>No operations in this period.</div>
      ) : (
        <>
          {selected && (
            <div className={styles.cashFlowSelection} aria-live="polite">
              <strong>{selected.fullLabel}</strong>
              <span>Income {formatAmount(selected.income, currency)}</span>
              <span>Expenses {formatAmount(selected.expenses, currency)}</span>
              <span className={selected.net >= 0
                ? styles.positiveValue
                : styles.negativeValue}
              >
                Net {selected.net >= 0 ? '+' : ''}{formatAmount(selected.net, currency)}
              </span>
            </div>
          )}
          <div className={styles.cashFlowScroller} ref={scrollerRef}>
            <div
              className={styles.cashFlowChart}
              style={{ minWidth: `${Math.max(620, points.length * 27)}px` }}
            >
              <div className={styles.cashFlowBaseline} aria-hidden="true" />
              {points.map((point, index) => {
                const height = point.net === 0
                  ? 0
                  : Math.max(2, (Math.abs(point.net) / maximum) * 46)
                const labelInterval = Math.max(1, Math.ceil(points.length / 10))
                const showLabel = index % labelInterval === 0 || index === points.length - 1
                return (
                  <div className={styles.cashFlowBucket} key={point.key}>
                    <button
                      type="button"
                      className={`${styles.cashFlowBar} ${
                        point.net >= 0 ? styles.positiveBar : styles.negativeBar
                      } ${selected?.key === point.key ? styles.selectedBar : ''}`}
                      style={{ height: `${height}%` }}
                      onClick={() => setSelectedKey(point.key)}
                      aria-label={`${point.fullLabel}: net ${formatAmount(point.net, currency)}`}
                      aria-pressed={selected?.key === point.key}
                    />
                    {showLabel && <span>{point.label}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export function StatisticsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange | null>(getCurrentMonthRange)
  const [assets, setAssets] = useState<Asset[]>([])
  const [accountIds, setAccountIds] = useState<string[]>([])
  const [currency, setCurrency] = useState('ILS')
  const [loanLedgers, setLoanLedgers] = useState<LoanLedger[]>([])
  const [categoryDefinitions, setCategoryDefinitions] = useState<Category[]>([])
  const [mutualIds, setMutualIds] = useState<string[]>([])
  const [showMutualOperations, setShowMutualOperations] = useState(false)
  const [operations, setOperations] = useState<LocatedOperation[]>([])
  const [previousOperations, setPreviousOperations] = useState<LocatedOperation[]>([])
  const [mutualOperations, setMutualOperations] = useState<LocatedOperation[]>([])
  const [previousMutualOperations, setPreviousMutualOperations] = useState<LocatedOperation[]>([])
  const [isSetupLoading, setIsSetupLoading] = useState(true)
  const [isOperationsLoading, setIsOperationsLoading] = useState(false)
  const [isComparisonLoading, setIsComparisonLoading] = useState(false)
  const [isMutualLoading, setIsMutualLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mutualOperationsCache = useRef(new Map<string, LocatedOperation[]>())

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadSetup() {
      try {
        setIsSetupLoading(true)
        setError(null)
        const preferences = await getUserPreferences(user!.uid)
        const preferenceAccountIds = preferences?.accounts?.map((account) => account.id) || []
        if (preferenceAccountIds.length === 0) {
          if (!cancelled) {
            setAssets([])
            setAccountIds([])
            setMutualIds([])
            setIsSetupLoading(false)
          }
          return
        }

        const [allAssets, storedCategoryLists] = await Promise.all([
          getAllAssetsForAccounts(preferenceAccountIds),
          Promise.all(preferenceAccountIds.map((accountId) =>
            getCategories(accountId).catch((categoryError) => {
              logger.warn(
                `Could not load category hierarchy for account ${accountId}.`,
                categoryError
              )
              return []
            })
          )),
        ])
        if (cancelled) return
        const hiddenAssetIds = new Set(
          (preferences?.assets || [])
            .filter((asset) => asset.hide)
            .map((asset) => asset.id)
        )
        const visibleAssets = allAssets.filter((asset) => !hiddenAssetIds.has(asset.id))
        const currencies = [...new Set(visibleAssets.map((asset) => asset.currency))]
        const preferredCurrency = currencies.includes(preferences?.mainCurrency || '')
          ? preferences!.mainCurrency
          : currencies[0] || 'ILS'

        setAssets(visibleAssets)
        setCategoryDefinitions(storedCategoryLists.flat())
        setAccountIds(preferenceAccountIds)
        setMutualIds(preferences?.mutuals || [])
        setCurrency(preferredCurrency)
        setIsSetupLoading(false)

        const mutuals = await getMutualsByIds(preferences?.mutuals || [])
        const loanMutuals = mutuals.filter((mutual) => mutual.type === 'loan')
        const ledgers = (await Promise.all(
          loanMutuals.map((mutual) => getLoanLedger(mutual.id))
        )).filter((ledger): ledger is LoanLedger => ledger !== null)
        if (!cancelled) setLoanLedgers(ledgers)
      } catch (loadError) {
        logger.error('Error loading statistics setup:', loadError)
        if (!cancelled) {
          setError('Failed to load statistics data.')
          setIsSetupLoading(false)
        }
      }
    }

    loadSetup()
    return () => { cancelled = true }
  }, [user])

  const currencyAssets = useMemo(
    () => assets.filter((asset) => asset.currency === currency),
    [assets, currency]
  )

  useEffect(() => {
    if (isSetupLoading) return
    let cancelled = false

    async function loadCurrentPeriod() {
      setIsOperationsLoading(true)
      setError(null)
      try {
        const results = await Promise.all(currencyAssets.map(async (asset) => {
          const items = dateRange
            ? await getOperationsByDateRange(asset.accountId, asset.id, dateRange)
            : await getOperationsByAssetId(asset.accountId, asset.id)
          return items.map((operation) => ({
            ...operation,
            accountId: asset.accountId,
            assetId: asset.id,
          }))
        }))
        if (!cancelled) setOperations(results.flat())
      } catch (loadError) {
        logger.error('Error loading statistics operations:', loadError)
        if (!cancelled) setError('Failed to load operations for this period.')
      } finally {
        if (!cancelled) setIsOperationsLoading(false)
      }
    }

    loadCurrentPeriod()
    return () => { cancelled = true }
  }, [currencyAssets, dateRange, isSetupLoading])

  useEffect(() => {
    if (!showMutualOperations || mutualIds.length === 0 || isSetupLoading) {
      setIsMutualLoading(false)
      return
    }
    let cancelled = false
    const localAccountIds = new Set(accountIds)
    const comparisonRange = getPreviousRange(dateRange)

    async function loadRange(
      range: DateRange | null,
      rangeName: 'current' | 'previous'
    ) {
      const cacheKey = [
        rangeName,
        [...mutualIds].sort().join(','),
        [...accountIds].sort().join(','),
        currency,
        range?.from.toISOString() || 'first',
        range?.to.toISOString() || 'last',
      ].join('|')
      const cached = mutualOperationsCache.current.get(cacheKey)
      if (cached) return cached

      const groups = await Promise.all(mutualIds.map((mutualId) =>
        getMutualOperations(mutualId, range || undefined)
      ))
      const unique = new Map<string, LocatedOperation>()
      groups.flat()
        .filter((operation) =>
          !localAccountIds.has(operation.accountId) &&
          !operation.settlementId &&
          operation.assetCurrency === currency
        )
        .forEach((operation) => {
          const key = `${operation.accountId}:${operation.assetId}:${operation.id}`
          unique.set(key, {
            id: operation.id,
            type: operation.type,
            userId: operation.userId,
            title: operation.title,
            amount: operation.amount,
            category: operation.category,
            comment: operation.comment,
            datetime: Timestamp.fromDate(operation.datetime),
            purposeId: operation.purposeId,
            settlementId: operation.settlementId,
            settlementDirection: operation.settlementDirection,
            accountId: operation.accountId,
            assetId: operation.assetId,
          })
        })
      const loaded = [...unique.values()]
      mutualOperationsCache.current.set(cacheKey, loaded)
      return loaded
    }

    async function loadMutualStatistics() {
      setIsMutualLoading(true)
      try {
        const [current, previous] = await Promise.all([
          loadRange(dateRange, 'current'),
          comparisonRange
            ? loadRange(comparisonRange, 'previous')
            : Promise.resolve([]),
        ])
        if (!cancelled) {
          setMutualOperations(current)
          setPreviousMutualOperations(previous)
        }
      } catch (loadError) {
        logger.error('Error loading mutual statistics:', loadError)
        if (!cancelled) setError('Mutual participant statistics could not be loaded.')
      } finally {
        if (!cancelled) setIsMutualLoading(false)
      }
    }

    loadMutualStatistics()
    return () => { cancelled = true }
  }, [accountIds, currency, dateRange, isSetupLoading, mutualIds, showMutualOperations])

  useEffect(() => {
    if (isSetupLoading) return
    const previousRange = getPreviousRange(dateRange)
    if (!previousRange) {
      setPreviousOperations([])
      setIsComparisonLoading(false)
      return
    }
    const comparisonRange = previousRange
    let cancelled = false

    async function loadPreviousPeriod() {
      setIsComparisonLoading(true)
      try {
        const results = await Promise.all(currencyAssets.map(async (asset) => {
          const items = await getOperationsByDateRange(
            asset.accountId,
            asset.id,
            comparisonRange
          )
          return items.map((operation) => ({
            ...operation,
            accountId: asset.accountId,
            assetId: asset.id,
          }))
        }))
        if (!cancelled) setPreviousOperations(results.flat())
      } catch (loadError) {
        logger.error('Error loading statistics comparison:', loadError)
        if (!cancelled) setPreviousOperations([])
      } finally {
        if (!cancelled) setIsComparisonLoading(false)
      }
    }

    loadPreviousPeriod()
    return () => { cancelled = true }
  }, [currencyAssets, dateRange, isSetupLoading])

  const currencies = useMemo(
    () => [...new Set(assets.map((asset) => asset.currency))],
    [assets]
  )
  const visibleOperations = useMemo(
    () => showMutualOperations ? [...operations, ...mutualOperations] : operations,
    [mutualOperations, operations, showMutualOperations]
  )
  const visiblePreviousOperations = useMemo(
    () => showMutualOperations
      ? [...previousOperations, ...previousMutualOperations]
      : previousOperations,
    [previousMutualOperations, previousOperations, showMutualOperations]
  )
  const totals = useMemo(
    () => calculatePeriodTotals(visibleOperations),
    [visibleOperations]
  )
  const previousTotals = useMemo(
    () => calculatePeriodTotals(visiblePreviousOperations),
    [visiblePreviousOperations]
  )
  const categories = useMemo(
    () => calculateCategories(visibleOperations, categoryDefinitions),
    [categoryDefinitions, visibleOperations]
  )
  const cashFlowSeries = useMemo(
    () => buildCashFlowSeries(visibleOperations, dateRange),
    [dateRange, visibleOperations]
  )
  const maximumCategoryAmount = categories[0]?.amount || 0
  const ownAccountIds = useMemo(
    () => new Set(accountIds),
    [accountIds]
  )
  const loanPosition = useMemo(() => loanLedgers.reduce(
    (position, ledger) => {
      if (ledger.currency !== currency) return position
      if (ownAccountIds.has(ledger.lenderAccountId)) position.owedToYou += ledger.balance
      if (ownAccountIds.has(ledger.borrowerAccountId)) position.youOwe += ledger.balance
      return position
    },
    { owedToYou: 0, youOwe: 0 }
  ), [currency, loanLedgers, ownAccountIds])
  const loanNet = loanPosition.owedToYou - loanPosition.youOwe
  const dayCount = getDaysInRange(dateRange, visibleOperations)
  const largestExpense = useMemo(() => visibleOperations.reduce<LocatedOperation | null>(
    (largest, operation) => operation.type === 'payment' && isFinancialOperation(operation) &&
      (!largest || operation.amount > largest.amount)
      ? operation
      : largest,
    null
  ), [visibleOperations])
  const hasComparison = dateRange !== null &&
    !isComparisonLoading &&
    !(showMutualOperations && isMutualLoading)

  if (authLoading) return <div className={styles.loadingScreen}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className={styles.page}>
      <NavBar />
      <main className={styles.main}>
        <header className={styles.toolbar}>
          <div>
            <h1>Statistics</h1>
            <p>{getPeriodLabel(dateRange)}</p>
          </div>
          <div className={styles.filters}>
            {mutualIds.length > 0 && (
              <button
                type="button"
                className={`${styles.mutualButton} ${
                  showMutualOperations ? styles.mutualButtonActive : ''
                }`}
                onClick={() => setShowMutualOperations((visible) => !visible)}
                aria-label={showMutualOperations
                  ? 'Show only my account statistics'
                  : 'Include mutual participant statistics'}
                aria-pressed={showMutualOperations}
                aria-busy={showMutualOperations && isMutualLoading}
                title={showMutualOperations
                  ? 'Show only my accounts'
                  : 'Include mutual participants'}
              >
                {showMutualOperations && isMutualLoading
                  ? <LoaderCircle className={styles.mutualSpinner} aria-hidden="true" />
                  : <Users aria-hidden="true" />}
              </button>
            )}
            {currencies.length > 1 && (
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                aria-label="Statistics currency"
              >
                {currencies.map((item) => <option key={item}>{item}</option>)}
              </select>
            )}
            <DateRangePicker value={dateRange} onChange={setDateRange} compact />
          </div>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {isSetupLoading || isOperationsLoading ? (
          <div className={styles.loadingScreen}>
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            <span>Calculating statistics...</span>
          </div>
        ) : currencyAssets.length === 0 ? (
          <div className={styles.emptyState}>
            <WalletCards aria-hidden="true" />
            <h2>No visible assets</h2>
            <p>Add an asset to start building statistics.</p>
          </div>
        ) : (
          <>
            <section className={styles.metrics} aria-label="Period overview">
              <Metric
                label="Income"
                value={formatAmount(totals.income, currency)}
                currentValue={totals.income}
                previousValue={hasComparison ? previousTotals.income : undefined}
                tone="income"
                icon={TrendingUp}
              />
              <Metric
                label="Expenses"
                value={formatAmount(totals.expenses, currency)}
                currentValue={totals.expenses}
                previousValue={hasComparison ? previousTotals.expenses : undefined}
                inverseTrend
                tone="expense"
                icon={TrendingDown}
              />
              <Metric
                label="Net cash flow"
                value={`${totals.net >= 0 ? '+' : ''}${formatAmount(totals.net, currency)}`}
                currentValue={totals.net}
                previousValue={hasComparison ? previousTotals.net : undefined}
                tone="net"
                icon={Scale}
              />
              <Metric
                label="Loan position"
                value={formatAmount(Math.abs(loanNet), currency)}
                tone="loan"
                icon={HandCoins}
                detail={loanNet > 0 ? 'Owed to you' : loanNet < 0 ? 'You owe' : 'Settled'}
              />
            </section>

            <CashFlowChart
              points={cashFlowSeries.points}
              granularity={cashFlowSeries.granularity}
              currency={currency}
            />

            <div className={styles.analysisGrid}>
              <section className={styles.panel}>
                <div className={styles.panelHeading}>
                  <div>
                    <h2>Expenses by category</h2>
                    <p>Share of spending in the selected period</p>
                  </div>
                  <ReceiptText aria-hidden="true" />
                </div>
                {categories.length === 0 ? (
                  <div className={styles.panelEmpty}>No expenses in this period.</div>
                ) : (
                  <div className={styles.categoryList}>
                    {categories.map((category) => (
                      <div className={styles.categoryRow} key={category.name}>
                        <div className={styles.categoryInfo}>
                          <span title={category.name}>{category.name}</span>
                          <strong>{formatAmount(category.amount, currency)}</strong>
                        </div>
                        <div className={styles.barTrack}>
                          <span style={{
                            width: `${Math.max(2, (category.amount / maximumCategoryAmount) * 100)}%`,
                          }} />
                        </div>
                        <span className={styles.categoryMeta}>
                          {totals.expenses > 0
                            ? `${Math.round((category.amount / totals.expenses) * 100)}%`
                            : '0%'}
                          {' / '}{category.count} {category.count === 1 ? 'operation' : 'operations'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside className={styles.panel}>
                <div className={styles.panelHeading}>
                  <div>
                    <h2>Period details</h2>
                    <p>Useful context behind the totals</p>
                  </div>
                  <CircleDollarSign aria-hidden="true" />
                </div>
                <dl className={styles.details}>
                  <div>
                    <dt>Operations</dt>
                    <dd>{totals.operationCount}</dd>
                  </div>
                  <div>
                    <dt>Average daily income</dt>
                    <dd className={styles.positiveValue}>{dayCount
                      ? formatAmount(totals.income / dayCount, currency)
                      : 'Not available'}</dd>
                  </div>
                  <div>
                    <dt>Average daily spending</dt>
                    <dd className={styles.negativeValue}>{dayCount
                      ? formatAmount(totals.expenses / dayCount, currency)
                      : 'Not available'}</dd>
                  </div>
                  <div>
                    <dt>Average daily net</dt>
                    <dd className={totals.net >= 0
                      ? styles.positiveValue
                      : styles.negativeValue}
                    >
                      {dayCount
                        ? `${totals.net >= 0 ? '+' : ''}${formatAmount(
                          totals.net / dayCount,
                          currency
                        )}`
                        : 'Not available'}
                    </dd>
                  </div>
                  <div>
                    <dt>Largest expense</dt>
                    <dd>{largestExpense
                      ? formatAmount(largestExpense.amount, currency)
                      : 'No expenses'}</dd>
                    {largestExpense && <small title={largestExpense.title}>
                      {largestExpense.title}
                    </small>}
                  </div>
                  <div>
                    <dt>Visible assets</dt>
                    <dd>{currencyAssets.length}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
