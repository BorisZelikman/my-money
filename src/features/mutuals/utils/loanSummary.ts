import type { LoanEntry, LoanLedger, Mutual } from '@/types'

export interface LoanPeriodSummary {
  currentBalance: number
  openingBalance: number
  advances: number
  repayments: number
  openingAdjustments: number
  closingBalance: number
}

export function getLoanViewerRole(
  mutual: Mutual,
  ledger: LoanLedger,
  userId: string,
  accountIds: string[]
): 'lender' | 'borrower' {
  const lenderParticipant = mutual.participants.find((participant) =>
    participant.accountId === (mutual.lenderAccountId || ledger.lenderAccountId)
  ) || mutual.participants.find((participant) => participant.userId === mutual.createdBy) ||
    mutual.participants[0]
  const isLender = mutual.createdBy === userId || lenderParticipant?.userId === userId ||
    accountIds.includes(ledger.lenderAccountId) ||
    (lenderParticipant && accountIds.includes(lenderParticipant.accountId)) ||
    ledger.entries.some((entry) => entry.lenderAssetAccountId &&
      accountIds.includes(entry.lenderAssetAccountId))
  return isLender ? 'lender' : 'borrower'
}

export function summarizeLoan(
  entries: Pick<LoanEntry, 'kind' | 'amount' | 'occurredAt'>[],
  range: { from: Date; to: Date } | null,
  now: Date = new Date()
): LoanPeriodSummary {
  const summary: LoanPeriodSummary = {
    currentBalance: 0, openingBalance: 0, advances: 0,
    repayments: 0, openingAdjustments: 0, closingBalance: 0,
  }
  const nowTime = now.getTime()
  const from = range?.from.getTime() ?? Number.NEGATIVE_INFINITY
  const to = Math.min(range?.to.getTime() ?? nowTime, nowTime)

  // Sum in minor units so partial repayments retain the exact remaining debt.
  for (const entry of entries) {
    const time = entry.occurredAt.getTime()
    if (!Number.isFinite(time) || time > nowTime) continue
    const amount = Math.round(entry.amount * 100)
    const delta = entry.kind === 'repayment' ? -amount : amount
    summary.currentBalance += delta
    if (time < from && time <= to) summary.openingBalance += delta
    if (time > to || time < from) continue
    if (entry.kind === 'repayment') summary.repayments += amount
    else if (entry.kind === 'opening-balance') summary.openingAdjustments += amount
    else summary.advances += amount
  }
  summary.closingBalance = summary.openingBalance + summary.advances +
    summary.openingAdjustments - summary.repayments
  for (const key of Object.keys(summary) as (keyof LoanPeriodSummary)[]) summary[key] /= 100
  return summary
}
