import { useState, useEffect } from 'react'
import styles from './DateRangePicker.module.css'

export interface DateRange {
  from: Date
  to: Date
}

type QuickFilter = 'today' | 'week' | 'month' | 'year' | 'all'

interface DateRangePickerProps {
  value: DateRange | null
  onChange: (range: DateRange | null) => void
}

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getQuickFilterRange = (filter: QuickFilter): DateRange | null => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)

    switch (filter) {
      case 'today':
        return { from: today, to: endOfDay }
      case 'week': {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { from: weekAgo, to: endOfDay }
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return { from: monthStart, to: endOfDay }
      }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1)
        return { from: yearStart, to: endOfDay }
      }
      case 'all':
        return null
    }
  }

  useEffect(() => {
    // Initialize with month filter
    const range = getQuickFilterRange('month')
    if (range) {
      onChange(range)
      setCustomFrom(formatDateForInput(range.from))
      setCustomTo(formatDateForInput(range.to))
    }
  }, [])

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
    setActiveFilter('all') // Clear quick filter selection
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999) // End of day
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
          className={`${styles.filterBtn} ${activeFilter === 'today' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'week' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('week')}
        >
          Week
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'month' ? styles.active : ''}`}
          onClick={() => handleQuickFilter('month')}
        >
          Month
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

