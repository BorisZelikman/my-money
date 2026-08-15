import { useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ui'
import type { AppliedSettlement, Asset, Mutual, SettlementData } from '@/types'
import { formatAmount } from '@/utils/currency'
import styles from './SettlementSummary.module.css'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

export interface SettlementTransferDraft {
  fromAccountId: string
  fromAccountTitle: string
  fromAssetId: string
  fromAssetTitle: string
  toAccountId: string
  toAccountTitle: string
  toAssetId: string
  toAssetTitle: string
  amount: number
  appliedAt: Date
}

interface SettlementSummaryProps {
  settlements: SettlementData[]
  mutual: Mutual | null
  assetsByAccount: Record<string, Asset[]>
  history: AppliedSettlement[]
  isApplying: boolean
  onApplySettlement: (draft: SettlementTransferDraft) => Promise<void>
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function formatHistoryDate(date: Date) {
  return new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function SettlementSummary({
  settlements,
  mutual,
  assetsByAccount,
  history,
  isApplying,
  onApplySettlement,
}: SettlementSummaryProps) {
  const { t } = useTranslation()
  const [fromAssetId, setFromAssetId] = useState('')
  const [toAssetId, setToAssetId] = useState('')
  const [appliedAt, setAppliedAt] = useState(() => formatDateForInput(new Date()))
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const fromAssetWasSelected = useRef(false)
  const toAssetWasSelected = useRef(false)
  const previousTransferRoute = useRef('')

  const totalExpenses = settlements[0]?.totalExpenses || 0
  const totalRate = settlements.reduce((sum, settlement) => sum + settlement.rate, 0)
  const debtor = settlements.find((settlement) => settlement.owes > 0.01)
  const creditor = settlements.find((settlement) => settlement.owes < -0.01)
  const transferAmount = debtor && creditor
    ? Math.min(debtor.owes, Math.abs(creditor.owes))
    : 0

  const fromAssets = useMemo(
    () => (debtor ? assetsByAccount[debtor.accountId] || [] : []).filter(
      (asset) => asset.currency === 'ILS'
    ),
    [assetsByAccount, debtor]
  )
  const toAssets = useMemo(
    () => (creditor ? assetsByAccount[creditor.accountId] || [] : []).filter(
      (asset) => asset.currency === 'ILS'
    ),
    [assetsByAccount, creditor]
  )

  const suggestedAssetIds = useMemo(() => {
    if (!debtor || !creditor) return { from: '', to: '' }

    const hasFromAsset = (assetId: string | null) =>
      Boolean(assetId && fromAssets.some((asset) => asset.id === assetId))
    const hasToAsset = (assetId: string | null) =>
      Boolean(assetId && toAssets.some((asset) => asset.id === assetId))

    for (const settlement of history) {
      const sameDirection =
        settlement.fromAccountId === debtor.accountId &&
        settlement.toAccountId === creditor.accountId
      if (
        sameDirection &&
        hasFromAsset(settlement.fromAssetId) &&
        hasToAsset(settlement.toAssetId)
      ) {
        return { from: settlement.fromAssetId || '', to: settlement.toAssetId || '' }
      }

      const reverseDirection =
        settlement.fromAccountId === creditor.accountId &&
        settlement.toAccountId === debtor.accountId
      if (
        reverseDirection &&
        hasFromAsset(settlement.toAssetId) &&
        hasToAsset(settlement.fromAssetId)
      ) {
        return { from: settlement.toAssetId || '', to: settlement.fromAssetId || '' }
      }
    }

    let suggestedFrom = ''
    let suggestedTo = ''
    for (const settlement of history) {
      if (!suggestedFrom) {
        if (
          settlement.fromAccountId === debtor.accountId &&
          hasFromAsset(settlement.fromAssetId)
        ) {
          suggestedFrom = settlement.fromAssetId || ''
        } else if (
          settlement.toAccountId === debtor.accountId &&
          hasFromAsset(settlement.toAssetId)
        ) {
          suggestedFrom = settlement.toAssetId || ''
        }
      }

      if (!suggestedTo) {
        if (
          settlement.toAccountId === creditor.accountId &&
          hasToAsset(settlement.toAssetId)
        ) {
          suggestedTo = settlement.toAssetId || ''
        } else if (
          settlement.fromAccountId === creditor.accountId &&
          hasToAsset(settlement.fromAssetId)
        ) {
          suggestedTo = settlement.fromAssetId || ''
        }
      }

      if (suggestedFrom && suggestedTo) break
    }

    return { from: suggestedFrom, to: suggestedTo }
  }, [creditor, debtor, fromAssets, history, toAssets])

  useEffect(() => {
    const transferRoute = `${debtor?.accountId || ''}->${creditor?.accountId || ''}`
    if (previousTransferRoute.current !== transferRoute) {
      previousTransferRoute.current = transferRoute
      fromAssetWasSelected.current = false
      toAssetWasSelected.current = false
    }

    setFromAssetId((current) => {
      const currentIsAvailable = fromAssets.some((asset) => asset.id === current)
      if (fromAssetWasSelected.current && currentIsAvailable) return current
      return suggestedAssetIds.from || fromAssets[0]?.id || ''
    })
    setToAssetId((current) => {
      const currentIsAvailable = toAssets.some((asset) => asset.id === current)
      if (toAssetWasSelected.current && currentIsAvailable) return current
      return suggestedAssetIds.to || toAssets[0]?.id || ''
    })
  }, [creditor?.accountId, debtor?.accountId, fromAssets, suggestedAssetIds, toAssets])

  if (!mutual || settlements.length === 0) return null

  const fromAsset = fromAssets.find((asset) => asset.id === fromAssetId)
  const toAsset = toAssets.find((asset) => asset.id === toAssetId)
  const canApply = Boolean(
    debtor && creditor && fromAsset && toAsset && appliedAt && transferAmount > 0.01
  )

  const handleConfirm = async () => {
    if (!debtor || !creditor || !fromAsset || !toAsset || !canApply) return

    try {
      await onApplySettlement({
        fromAccountId: debtor.accountId,
        fromAccountTitle: debtor.accountTitle,
        fromAssetId: fromAsset.id,
        fromAssetTitle: fromAsset.title,
        toAccountId: creditor.accountId,
        toAccountTitle: creditor.accountTitle,
        toAssetId: toAsset.id,
        toAssetTitle: toAsset.title,
        amount: transferAmount,
        appliedAt: parseInputDate(appliedAt),
      })
      setIsConfirmOpen(false)
    } catch {
      // The page reports the transaction error and keeps the dialog open for retry.
    }
  }

  const confirmationMessage = debtor && creditor && fromAsset && toAsset
    ? `${formatAmount(transferAmount, 'ILS')} will be transferred from ${debtor.accountTitle} / ${fromAsset.title} to ${creditor.accountTitle} / ${toAsset.title} on ${formatHistoryDate(parseInputDate(appliedAt))}. Both asset balances and the mutual balance will be updated.`
    : ''

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('mutuals.settlementSummary')}</h2>

      <div className={styles.totalCard}>
        <span className={styles.totalIcon}>&#128176;</span>
        <div className={styles.totalInfo}>
          <span className={styles.totalLabel}>{t('mutuals.totalShared')}</span>
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
                <span className={styles.statLabel}>{t('mutuals.expected')}</span>
                <span className={styles.statValue}>
                  {formatAmount(settlement.expectedShare, 'ILS')}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('mutuals.actuallyPaid')}</span>
                <span className={styles.statValue}>
                  {formatAmount(settlement.actualPayments, 'ILS')}
                </span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              {settlement.owes > 0.01 ? (
                <>
                  <span className={styles.statusIcon}>&#128228;</span>
                  <span className={styles.statusText}>
                    Owes {formatAmount(settlement.owes, 'ILS')}
                  </span>
                </>
              ) : settlement.owes < -0.01 ? (
                <>
                  <span className={styles.statusIcon}>&#128229;</span>
                  <span className={styles.statusText}>
                    Is owed {formatAmount(Math.abs(settlement.owes), 'ILS')}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.statusIcon}>&#10003;</span>
                  <span className={styles.statusText}>{t('common.settled')}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className={styles.settlementAction}>
        {debtor && creditor ? (
          <>
            <div className={styles.settlementInfo}>
              <span className={styles.settlementIcon}>&#8646;</span>
              <div className={styles.settlementText}>
                <strong>{debtor.accountTitle}</strong> should transfer{' '}
                <strong className={styles.settlementAmount}>
                  {formatAmount(transferAmount, 'ILS')}
                </strong>{' '}
                to <strong>{creditor.accountTitle}</strong>
              </div>
            </div>

            <div className={styles.transferControls}>
              <label className={styles.control}>
                <span>{t('mutuals.fromAsset')}</span>
                <select
                  value={fromAssetId}
                  onChange={(event) => {
                    fromAssetWasSelected.current = true
                    setFromAssetId(event.target.value)
                  }}
                >
                  {fromAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} ({formatAmount(asset.amount, asset.currency)})
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.control}>
                <span>{t('mutuals.toAsset')}</span>
                <select
                  value={toAssetId}
                  onChange={(event) => {
                    toAssetWasSelected.current = true
                    setToAssetId(event.target.value)
                  }}
                >
                  {toAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} ({formatAmount(asset.amount, asset.currency)})
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.control}>
                <span>{t('mutuals.settlementDate')}</span>
                <input
                  type="date"
                  value={appliedAt}
                  max={formatDateForInput(new Date())}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  onChange={(event) => setAppliedAt(event.target.value)}
                />
              </label>

              <button
                type="button"
                className={styles.applyButton}
                disabled={!canApply || isApplying}
                onClick={() => setIsConfirmOpen(true)}
              >
                {isApplying ? t('common.saving') : t('mutuals.applySettlement')}
              </button>
            </div>

            {(fromAssets.length === 0 || toAssets.length === 0) && (
              <p className={styles.assetWarning}>
                Both accounts need an ILS asset before this transfer can be applied.
              </p>
            )}
          </>
        ) : (
          <div className={styles.balancedMessage}>
            <span>&#10003;</span>
            <strong>{t('mutuals.noSettlement')}</strong>
          </div>
        )}

        <button
          type="button"
          className={styles.historyButton}
          aria-expanded={isHistoryOpen}
          onClick={() => setIsHistoryOpen((current) => !current)}
        >
          <span>{t('mutuals.settlementHistory')}</span>
          <span className={styles.historyCount}>{history.length}</span>
          <span className={styles.chevron}>{isHistoryOpen ? '\u25B2' : '\u25BC'}</span>
        </button>

        {isHistoryOpen && (
          <div className={styles.history}>
            {history.length === 0 ? (
              <p className={styles.emptyHistory}>{t('mutuals.noSettlements')}</p>
            ) : (
              history.map((settlement) => (
                <article key={settlement.id} className={styles.historyRow}>
                  <div className={styles.historyMain}>
                    <div className={styles.historyRoute}>
                      <strong>{settlement.fromAccountTitle}</strong>
                      <span className={styles.routeArrow}>&#8594;</span>
                      <strong>{settlement.toAccountTitle}</strong>
                      {settlement.isLegacy && (
                        <span className={styles.legacyBadge}>Legacy</span>
                      )}
                    </div>
                    <div className={styles.historyAssets}>
                      {settlement.fromAssetTitle || 'Source asset not recorded'}
                      <span>&#8594;</span>
                      {settlement.toAssetTitle || 'Destination asset not recorded'}
                    </div>
                    <div className={styles.historyMeta}>
                      {formatHistoryDate(settlement.appliedAt)}
                      <span>{settlement.scopePurposeTitle}</span>
                      <span>{settlement.createdByName}</span>
                    </div>
                  </div>
                  <strong className={styles.historyAmount}>
                    {formatAmount(settlement.amount, 'ILS')}
                  </strong>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={t('mutuals.applySettlement')}
        message={confirmationMessage}
        confirmLabel={isApplying ? t('common.saving') : t('common.apply')}
        variant="info"
        onConfirm={handleConfirm}
        onCancel={() => !isApplying && setIsConfirmOpen(false)}
      />
    </div>
  )
}
