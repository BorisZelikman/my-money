import { useTranslation } from 'react-i18next'
import { HandCoins } from 'lucide-react'
import i18n from '@/i18n'
import { formatAmount } from '@/utils/currency'
import type { LoanPeriodSummary } from '@/features/mutuals/utils/loanSummary'
import styles from './LoanPeriodReport.module.css'

export interface LoanReportRow {
  id: string
  title: string
  viewerRole: 'lender' | 'borrower'
  summary: LoanPeriodSummary
}

interface LoanPeriodReportProps {
  rows: LoanReportRow[]
  currency: string
  range: { from: Date; to: Date } | null
}

export function LoanPeriodReport({ rows, currency, range }: LoanPeriodReportProps) {
  const { t } = useTranslation()
  if (rows.length === 0) return null
  const hasAdjustments = rows.some((row) => row.summary.openingAdjustments !== 0)
  const formatDate = (date: Date) => new Intl.DateTimeFormat(
    i18n.resolvedLanguage || i18n.language,
    { day: 'numeric', month: 'short', year: 'numeric' }
  ).format(date)

  return (
    <section className={styles.report} aria-labelledby="loan-period-title">
      <div className={styles.heading}>
        <h2 id="loan-period-title"><HandCoins size={19} aria-hidden="true" />{t('loans.periodReport')}</h2>
        <span>{range
          ? `${formatDate(range.from)} – ${formatDate(range.to)}`
          : t('dateRange.allTime')}</span>
      </div>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label={t('loans.periodReport')}>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('loans.counterparty')}</th>
              <th scope="col">{t('loans.openingBalance')}</th>
              <th scope="col">{t('loans.advanced')}</th>
              {hasAdjustments && <th scope="col">{t('loans.openingAdjustments')}</th>}
              <th scope="col">{t('loans.repaid')}</th>
              <th scope="col">{t('loans.closingBalance')}</th>
              <th scope="col">{t('loans.balanceNow')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ id, title, viewerRole, summary }) => (
              <tr key={id}>
                <th scope="row">
                  <span>{title}</span>
                  <small>{viewerRole === 'lender' ? t('statistics.owedToYou') : t('statistics.youOwe')}</small>
                </th>
                <td>{formatAmount(summary.openingBalance, currency)}</td>
                <td>{formatAmount(summary.advances, currency)}</td>
                {hasAdjustments && <td>{formatAmount(summary.openingAdjustments, currency)}</td>}
                <td>{formatAmount(summary.repayments, currency)}</td>
                <td className={styles.closing}>{formatAmount(summary.closingBalance, currency)}</td>
                <td className={styles.current}>{formatAmount(summary.currentBalance, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
