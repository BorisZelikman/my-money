import { useState, useEffect, useRef } from 'react'
import {
  CalendarCheck,
  CalendarMinus,
  CalendarRange,
  Infinity as InfinityIcon,
} from 'lucide-react'
import styles from './DateRangePicker.module.css'
import { useTranslation } from 'react-i18next'

export interface DateRange {
  from: Date
  to: Date
}

type QuickFilter = 'previousMonth' | 'currentMonth' | 'year' | 'all' | 'custom'

interface DateRangePickerProps {
  value: DateRange | null
  onChange: (range: DateRange | null) => void
  compact?: boolean
  showCustomRange?: boolean
  allRange?: DateRange | null
}

export function DateRangePicker({
  value,
  onChange,
  compact = false,
  showCustomRange = !compact,
  allRange = null,
}: DateRangePickerProps) {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('currentMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const hasInitialized = useRef(false)

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseInputDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const getQuickFilterRange = (filter: QuickFilter): DateRange | null => {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    switch (filter) {
      case 'previousMonth': {
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const previousMonthEnd = new Date(currentMonthStart.getTime() - 1)
        return { from: previousMonthStart, to: previousMonthEnd }
      }
      case 'currentMonth':
        return { from: currentMonthStart, to: now }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1)
        return { from: yearStart, to: now }
      }
      case 'all':
      case 'custom':
        return null
    }
  }

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    if (value) {
      setCustomFrom(formatDateForInput(value.from))
      setCustomTo(formatDateForInput(value.to))
      return
    }

    const range = getQuickFilterRange('currentMonth')
    if (range) {
      onChange(range)
      setCustomFrom(formatDateForInput(range.from))
      setCustomTo(formatDateForInput(range.to))
    }
  }, [onChange, value])

  useEffect(() => {
    if (activeFilter !== 'all') return
    setCustomFrom(allRange ? formatDateForInput(allRange.from) : '')
    setCustomTo(formatDateForInput(allRange?.to || new Date()))
  }, [activeFilter, allRange])

  const handleQuickFilter = (filter: QuickFilter) => {
    setActiveFilter(filter)
    const range = getQuickFilterRange(filter)
    onChange(range)
    if (range) {
      setCustomFrom(formatDateForInput(range.from))
      setCustomTo(formatDateForInput(range.to))
    } else if (filter === 'all') {
      setCustomFrom(allRange ? formatDateForInput(allRange.from) : '')
      setCustomTo(formatDateForInput(allRange?.to || new Date()))
    }
  }

  const handleCustomDateChange = (from: string, to: string) => {
    setActiveFilter('custom')
    if (from && to) {
      const fromDate = parseInputDate(from)
      const toDate = parseInputDate(to)
      toDate.setHours(23, 59, 59, 999)
      if (fromDate <= toDate) {
        onChange({ from: fromDate, to: toDate })
      }
    }
  }

  const quickFilters: Array<{
    id: Exclude<QuickFilter, 'custom'>
    label: string
    icon: typeof CalendarCheck
  }> = [
    { id: 'previousMonth', label: t('dateRange.previousMonth'), icon: CalendarMinus },
    { id: 'currentMonth', label: t('dateRange.currentMonth'), icon: CalendarCheck },
    { id: 'year', label: t('dateRange.currentYear'), icon: CalendarRange },
    { id: 'all', label: t('dateRange.allTime'), icon: InfinityIcon },
  ]

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.quickFilters} role="group" aria-label={t('dateRange.interval')}>
        {quickFilters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`${styles.filterBtn} ${activeFilter === id ? styles.active : ''}`}
            onClick={() => handleQuickFilter(id)}
            aria-label={label}
            title={label}
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
      </div>

      {showCustomRange && <div className={styles.customRange}>
        <div className={styles.dateField}>
          <label>{t('common.from')}</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => {
              setCustomFrom(e.target.value)
              handleCustomDateChange(e.target.value, customTo)
            }}
          />
        </div>
        <span className={styles.separator} aria-hidden="true">&rarr;</span>
        <div className={styles.dateField}>
          <label>{t('common.to')}</label>
          <input
            type="date"
            value={customTo}
            onChange={(e) => {
              setCustomTo(e.target.value)
              handleCustomDateChange(customFrom, e.target.value)
            }}
          />
        </div>
      </div>}
    </div>
  )
}

