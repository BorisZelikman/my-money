import { useState, useEffect } from 'react'
import styles from './DateRangePicker.module.css'

export interface DateRange {
  from: Date
  to: Date
}

type QuickFilter = 'previousMonth' | 'currentMonth' | 'year' | 'all' | 'custom'

interface DateRangePickerProps {
  value: DateRange | null
  onChange: (range: DateRange | null) => void
}

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('currentMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

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
    const range = getQuickFilterRange('currentMonth')
    if (range) {
      onChange(range)
      setCustomFrom(formatDateForInput(range.from))
      setCustomTo(formatDateForInput(range.to))
    }
  }, [onChange])

  const handleQuickFilter = (filter: QuickFilter) => {
    setActiveFilter(filter)
    const range = getQuickFilterRange(filter)
    onChange(range)
    if (range) {
      setCustomFrom(formatDateForInput(range.from))
      setCustomTo(formatDateForInput(range.to))
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

  return (
    <div className={styles.container}>
      <div className={styles.quickFilters}>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'previousMonth' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('previousMonth')}
        >
          Previous Month
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'currentMonth' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('currentMonth')}
        >
          Current Month
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'year' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('year')}
        >
          Year
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('all')}
        >
          All
        </button>
      </div>

      <div className={styles.customRange}>
        <div className={styles.dateField}>
          <label>From</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => {
              setCustomFrom(e.target.value)
              handleCustomDateChange(e.target.value, customTo)
            }}
          />
        </div>
        <span className={styles.separator}>→</span>
        <div className={styles.dateField}>
          <label>To</label>
          <input
            type="date"
            value={customTo}
            onChange={(e) => {
              setCustomTo(e.target.value)
              handleCustomDateChange(customFrom, e.target.value)
            }}
          />
        </div>
      </div>
    </div>
  )
}

