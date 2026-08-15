import {
  CalendarDays,
  Car,
  CircleDollarSign,
  Fuel,
  Gauge,
  Route,
} from 'lucide-react'
import { formatAmount } from '@/utils/currency'
import type { CarAnalytics } from '../utils/carAnalytics'
import styles from './StatisticsPage.module.css'
import { useTranslation } from 'react-i18next'

interface CarAnalyticsPanelProps {
  analytics: CarAnalytics
  currency: string
}

function formatMetric(value: number | null, suffix = '') {
  return value === null ? 'Not enough data' : `${value.toFixed(2)}${suffix}`
}

export function CarAnalyticsPanel({ analytics, currency }: CarAnalyticsPanelProps) {
  const { t, i18n } = useTranslation()
  const fuelCoverage = analytics.fuelOperationCount > 0
    ? Math.round((analytics.completeFuelRecords / analytics.fuelOperationCount) * 100)
    : 0

  return (
    <section className={`${styles.panel} ${styles.carPanel}`}>
      <div className={styles.panelHeading}>
        <div>
          <h2>{t('statistics.carCosts')}</h2>
          <p>{analytics.operationCount} operations in the selected period</p>
        </div>
        <Car aria-hidden="true" />
      </div>
      <div className={styles.carMetrics}>
        <div>
          <CircleDollarSign aria-hidden="true" />
          <span>{t('statistics.totalCost')}</span>
          <strong>{formatAmount(analytics.totalCost, currency)}</strong>
        </div>
        <div>
          <CalendarDays aria-hidden="true" />
          <span>{t('statistics.costPerDay')}</span>
          <strong>{analytics.costPerDay === null
            ? 'Not available'
            : formatAmount(analytics.costPerDay, currency)}</strong>
        </div>
        <div>
          <Fuel aria-hidden="true" />
          <span>{t('statistics.fuelCost')}</span>
          <strong>{formatAmount(analytics.fuelCost, currency)}</strong>
        </div>
        <div>
          <CircleDollarSign aria-hidden="true" />
          <span>{t('statistics.averagePerLiter')}</span>
          <strong>{analytics.averageUnitPrice === null
            ? 'Not enough data'
            : formatAmount(analytics.averageUnitPrice, currency)}</strong>
        </div>
        <div>
          <Route aria-hidden="true" />
          <span>{t('statistics.trackedDistance')}</span>
          <strong>{analytics.trackedDistance > 0
            ? `${analytics.trackedDistance.toLocaleString(i18n.resolvedLanguage)} km`
            : 'Not enough data'}</strong>
        </div>
        <div>
          <Gauge aria-hidden="true" />
          <span>{t('statistics.fuelConsumption')}</span>
          <strong>{formatMetric(analytics.litersPer100Km, ' L/100 km')}</strong>
        </div>
        <div>
          <Fuel aria-hidden="true" />
          <span>{t('statistics.fuelPerKm')}</span>
          <strong>{analytics.fuelCostPerKm === null
            ? 'Not enough data'
            : formatAmount(analytics.fuelCostPerKm, currency)}</strong>
        </div>
        <div>
          <Gauge aria-hidden="true" />
          <span>{t('statistics.dataCoverage')}</span>
          <strong>{fuelCoverage}%</strong>
        </div>
      </div>
      <div className={styles.carDataQuality}>
        <span>{analytics.validIntervals} valid mileage intervals</span>
        <span>{analytics.incompleteFuelRecords} incomplete fuel records</span>
        {analytics.validIntervals === 0 && analytics.currentSegmentReadings === 1 && (
          <span>One more complete fill will start the new interval</span>
        )}
        {analytics.latestOdometer !== null && (
          <span>{t('statistics.latestReading')} {analytics.latestOdometer.toLocaleString(i18n.resolvedLanguage)} km</span>
        )}
      </div>
    </section>
  )
}
