import { Gauge, Sigma } from 'lucide-react'
import { formatAmount } from '@/utils/currency'
import type { MeasurementAnalytics } from '../utils/measurementAnalytics'
import styles from './StatisticsPage.module.css'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

interface MeasurementAnalyticsPanelProps {
  analytics: MeasurementAnalytics[]
  currency: string
}

function formatNumber(value: number) {
  return value.toLocaleString(i18n.resolvedLanguage || i18n.language, { maximumFractionDigits: 3 })
}

function resultLabel(item: MeasurementAnalytics) {
  if (item.aggregation === 'delta') return 'Period use'
  if (item.aggregation === 'sum') return 'Total'
  if (item.aggregation === 'average') return 'Average'
  return 'Latest'
}

export function MeasurementAnalyticsPanel({
  analytics,
  currency,
}: MeasurementAnalyticsPanelProps) {
  const { t } = useTranslation()
  if (analytics.length === 0) return null

  return (
    <section className={`${styles.panel} ${styles.measurementPanel}`}>
      <div className={styles.panelHeading}>
        <div>
          <h2>{t('statistics.measurements')}</h2>
          <p>{t('statistics.measurementsHint')}</p>
        </div>
        <Gauge aria-hidden="true" />
      </div>
      <div className={styles.measurementList}>
        {analytics.map((item) => (
          <article key={item.key} className={styles.measurementRow}>
            <div className={styles.measurementIdentity}>
              <strong>{item.category}</strong>
              <span>{item.label}</span>
            </div>
            <div className={styles.measurementMetric}>
              <span>{resultLabel(item)}</span>
              <strong>{formatNumber(item.result)}{item.unit ? ` ${item.unit}` : ''}</strong>
            </div>
            {item.aggregation === 'delta' && (
              <div className={styles.measurementMetric}>
                <span>{t('statistics.latestReading')}</span>
                <strong>{formatNumber(item.latestValue)}{item.unit ? ` ${item.unit}` : ''}</strong>
              </div>
            )}
            {item.costPerUnit !== null && (
              <div className={styles.measurementMetric}>
                <span>Cost / {item.unit || 'unit'}</span>
                <strong>{formatAmount(item.costPerUnit, currency)}</strong>
              </div>
            )}
            <div className={styles.measurementMeta}>
              <Sigma aria-hidden="true" />
              <span>{item.operationCount} records</span>
              {item.aggregation === 'delta' && (
                <span>{item.validIntervals} valid intervals</span>
              )}
              {item.skippedIntervals > 0 && (
                <span>{item.skippedIntervals} resets or invalid intervals skipped</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
