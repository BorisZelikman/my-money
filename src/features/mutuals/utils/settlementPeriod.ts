import type { AppliedSettlement } from '@/types'

export interface SettlementPeriod {
  periodFrom: string
  periodTo: string
}

export function calendarDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function isValidSettlementPeriod(period: SettlementPeriod) {
  return isCalendarDate(period.periodFrom) && isCalendarDate(period.periodTo) &&
    period.periodFrom <= period.periodTo
}

export function settlementMatchesPeriod(
  settlement: Pick<AppliedSettlement, 'periodFrom' | 'periodTo' | 'appliedAt'>,
  range: { from: Date; to: Date } | null
) {
  if (!range) return true
  if (settlement.periodFrom && settlement.periodTo) {
    // A combined-period settlement cannot be allocated to just one of its months.
    return settlement.periodFrom >= calendarDate(range.from) &&
      settlement.periodTo <= calendarDate(range.to)
  }
  // Preserve old records until their period has been explicitly assigned.
  return settlement.appliedAt >= range.from && settlement.appliedAt <= range.to
}
