import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import {
  ArrowLeftRight,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileSearch,
  FileUp,
  LoaderCircle,
  SearchX,
} from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { useAuth } from '@/features/auth'
import { getAllAssetsForAccounts } from '@/features/assets/services/assetService'
import { getOperationsByDateRange } from '@/features/operations/services/operationService'
import { getUserPreferences } from '@/features/profile/services/userService'
import type { Asset } from '@/types'
import { formatAmount } from '@/utils/currency'
import { logger } from '@/utils/logger'
import type {
  BankTransaction,
  ReconciliationOperation,
  ReconciliationRow,
  ReconciliationStatus,
} from '../types'
import { parseHapoalimWorkbook } from '../utils/hapoalimParser'
import { reconcileOperations } from '../utils/reconcileOperations'
import styles from './ReconciliationPage.module.css'

type ResultFilter = 'all' | 'matched' | 'review' | 'card-settlement'

const STATUS_LABELS: Record<ReconciliationStatus, string> = {
  matched: 'Matched',
  'near-match': 'Date differs',
  'bank-only': 'Bank only',
  'app-only': 'MyMoney only',
  'card-settlement': 'Card statement',
}

function transactionDate(row: ReconciliationRow) {
  return row.bank?.date || row.operation?.datetime.toDate() || new Date(0)
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2
  label: string
  value: number
  tone: 'good' | 'warning' | 'neutral'
}) {
  return (
    <div className={`${styles.summaryItem} ${styles[tone]}`}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ReconciliationPage() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetId, setAssetId] = useState('')
  const [fileName, setFileName] = useState('')
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const [operations, setOperations] = useState<ReconciliationOperation[]>([])
  const [filter, setFilter] = useState<ResultFilter>('all')
  const [isSetupLoading, setIsSetupLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadAssets() {
      try {
        setIsSetupLoading(true)
        const preferences = await getUserPreferences(user!.uid)
        const accountIds = preferences?.accounts?.map((account) => account.id) || []
        const allAssets = await getAllAssetsForAccounts(accountIds)
        const hiddenIds = new Set(
          (preferences?.assets || []).filter((asset) => asset.hide).map((asset) => asset.id)
        )
        const visibleAssets = allAssets.filter((asset) => !hiddenIds.has(asset.id))
        const preferred = visibleAssets.find((asset) => asset.id === preferences?.currentAssetId) ||
          visibleAssets.find((asset) => /hapoalim/i.test(asset.title)) || visibleAssets[0]
        if (!cancelled) {
          setAssets(visibleAssets)
          setAssetId(preferred?.id || '')
        }
      } catch (loadError) {
        logger.error('Error loading reconciliation assets:', loadError)
        if (!cancelled) setError('Failed to load assets.')
      } finally {
        if (!cancelled) setIsSetupLoading(false)
      }
    }

    loadAssets()
    return () => { cancelled = true }
  }, [user])

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === assetId) || null,
    [assetId, assets]
  )

  async function importStatement(file: File) {
    if (!selectedAsset) return
    setIsImporting(true)
    setError(null)
    try {
      const transactions = await parseHapoalimWorkbook(file)
      if (transactions.length === 0) throw new Error('The workbook contains no transactions.')
      const from = new Date(Math.min(...transactions.map((transaction) => transaction.date.getTime())))
      from.setHours(0, 0, 0, 0)
      const to = new Date(Math.max(...transactions.map((transaction) => transaction.date.getTime())))
      to.setHours(23, 59, 59, 999)
      const loadedOperations = await getOperationsByDateRange(
        selectedAsset.accountId,
        selectedAsset.id,
        { from, to }
      )
      setBankTransactions(transactions)
      setOperations(loadedOperations.map((operation) => ({
        ...operation,
        accountId: selectedAsset.accountId,
        assetId: selectedAsset.id,
      })))
      setFileName(file.name)
      setFilter('all')
    } catch (importError) {
      logger.error('Error importing bank statement:', importError)
      setError(importError instanceof Error
        ? importError.message
        : 'Failed to read the bank statement.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const rows = useMemo(
    () => reconcileOperations(bankTransactions, operations),
    [bankTransactions, operations]
  )
  const filteredRows = useMemo(() => rows.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'matched') return row.status === 'matched'
    if (filter === 'card-settlement') return row.status === 'card-settlement'
    return row.status === 'near-match' || row.status === 'bank-only' || row.status === 'app-only'
  }), [filter, rows])
  const summary = useMemo(() => ({
    matched: rows.filter((row) => row.status === 'matched').length,
    review: rows.filter((row) => ['near-match', 'bank-only', 'app-only'].includes(row.status)).length,
    cards: rows.filter((row) => row.status === 'card-settlement').length,
  }), [rows])

  function openOperation(operation: ReconciliationOperation) {
    const params = new URLSearchParams({
      accountId: operation.accountId,
      assetId: operation.assetId,
      operationId: operation.id,
    })
    navigate(`/operations?${params.toString()}`)
  }

  if (authLoading) return <div className={styles.loadingScreen}>{t('common.loading')}</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className={styles.page}>
      <NavBar />
      <main className={styles.main}>
        <header className={styles.toolbar}>
          <div className={styles.titleBlock}>
            <h1>{t('reconciliation.title')}</h1>
            {fileName && <span title={fileName}>{fileName}</span>}
          </div>
          <div className={styles.actions}>
            {assets.length > 1 && (
              <select
                value={assetId}
                onChange={(event) => {
                  setAssetId(event.target.value)
                  setBankTransactions([])
                  setOperations([])
                  setFileName('')
                }}
                aria-label={t('reconciliation.selectAsset')}
              >
                {assets.map((asset) => (
                  <option key={`${asset.accountId}:${asset.id}`} value={asset.id}>
                    {asset.title} ({asset.currency})
                  </option>
                ))}
              </select>
            )}
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importStatement(file)
              }}
            />
            <button
              type="button"
              className={styles.importButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedAsset || isImporting}
            >
              {isImporting
                ? <LoaderCircle className={styles.spinner} aria-hidden="true" />
                : <FileUp aria-hidden="true" />}
              <span>{t('reconciliation.importExcel')}</span>
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}
          {isSetupLoading ? (
            <div className={styles.emptyState}><LoaderCircle className={styles.spinner} />{t('reconciliation.loadingAssets')}</div>
          ) : !selectedAsset ? (
            <div className={styles.emptyState}><SearchX />No visible assets</div>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>
              <FileSearch aria-hidden="true" />
              <h2>{t('reconciliation.chooseFile')}</h2>
              <p>{t('reconciliation.privacy')}</p>
            </div>
          ) : (
            <>
              <section className={styles.summary} aria-label="Reconciliation summary">
                <SummaryItem icon={CheckCircle2} label="Exact matches" value={summary.matched} tone="good" />
                <SummaryItem icon={CircleAlert} label="Needs review" value={summary.review} tone="warning" />
                <SummaryItem icon={CreditCard} label="Card statements" value={summary.cards} tone="neutral" />
                <div className={styles.statementCount}>{bankTransactions.length} bank rows · {operations.length} app operations</div>
              </section>

              <section className={styles.results}>
                <div className={styles.resultToolbar}>
                  <div className={styles.filterGroup} aria-label="Result filter">
                    {([
                      ['all', 'All'],
                      ['matched', 'Matched'],
                      ['review', 'Review'],
                      ['card-settlement', 'Cards'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={filter === value ? styles.filterActive : ''}
                        onClick={() => setFilter(value)}
                        aria-pressed={filter === value}
                      >{label}</button>
                    ))}
                  </div>
                  <span>{filteredRows.length} rows</span>
                </div>
                <div className={styles.tableFrame}>
                  <table>
                    <thead>
                      <tr>
                        <th>{t('common.date')}</th>
                        <th>{t('reconciliation.bankTransaction')}</th>
                        <th>{t('common.amount')}</th>
                        <th>{t('reconciliation.status')}</th>
                        <th>{t('reconciliation.appOperation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => {
                        const amount = row.bank?.amount ?? (row.operation
                          ? (row.operation.type === 'payment' ? -row.operation.amount : row.operation.amount)
                          : 0)
                        return (
                          <tr key={row.id} className={styles[row.status]}>
                            <td>{formatDate(transactionDate(row))}</td>
                            <td>
                              <strong>{row.bank?.description || 'No bank match'}</strong>
                              {row.bank?.reference && <small>Ref. {row.bank.reference}</small>}
                            </td>
                            <td className={amount >= 0 ? styles.positiveAmount : styles.negativeAmount}>
                              {amount >= 0 ? '+' : ''}{formatAmount(amount, selectedAsset.currency)}
                            </td>
                            <td>
                              <span className={styles.status}>{STATUS_LABELS[row.status]}</span>
                              {row.dayDifference ? <small>{row.dayDifference} day difference</small> : null}
                            </td>
                            <td>
                              {row.operation ? (
                                <button
                                  type="button"
                                  className={styles.operationLink}
                                  onClick={() => openOperation(row.operation!)}
                                >
                                  <ArrowLeftRight aria-hidden="true" />
                                  <span>{row.operation.title}</span>
                                </button>
                              ) : <span className={styles.muted}>{t('reconciliation.noDirect')}</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
