import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/features/mutuals/utils/loanSummary.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
})
const { summarizeLoan, getLoanViewerRole } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)
const entry = (date, kind, amount) => ({ occurredAt: new Date(date), kind, amount })
const range = (month) => ({
  from: new Date(2026, month - 1, 1), to: new Date(2026, month, 0, 23, 59, 59, 999),
})
const entries = [
  entry('2026-09-01T12:00:00', 'opening-balance', 15370.95),
  entry('2026-10-01T12:00:00', 'repayment', 6588),
  ...[100, 2037.75, 200, 400, 600, 200, 200].map((amount) =>
    entry('2026-10-19T12:00:00', 'advance', amount)),
]
const novemberNow = new Date(2026, 10, 1, 12)

test('October reconciles the real opening debt, partial repayment and new loans', () => {
  assert.deepEqual(summarizeLoan(entries, range(10), novemberNow), {
    currentBalance: 12520.7, openingBalance: 15370.95, advances: 3737.75,
    repayments: 6588, openingAdjustments: 0, closingBalance: 12520.7,
  })
})

test('Empty November carries forward the debt and changing the filter keeps current debt', () => {
  const november = summarizeLoan(entries, range(11), novemberNow)
  assert.deepEqual(november, {
    currentBalance: 12520.7, openingBalance: 12520.7, advances: 0,
    repayments: 0, openingAdjustments: 0, closingBalance: 12520.7,
  })
  assert.equal(summarizeLoan(entries, range(9), novemberNow).currentBalance, november.currentBalance)
  assert.equal(summarizeLoan(entries, null, novemberNow).currentBalance, november.currentBalance)
})

test('Following-month repayments do not rewrite a historical month or reset partial debt', () => {
  const later = [...entries, entry('2026-11-03T12:00:00', 'repayment', 3000)]
  const now = new Date(2026, 10, 12)
  const october = summarizeLoan(later, range(10), now)
  const november = summarizeLoan(later, range(11), now)
  assert.equal(october.closingBalance, 12520.7)
  assert.equal(october.currentBalance, 9520.7)
  assert.equal(november.openingBalance, 12520.7)
  assert.equal(november.closingBalance, 9520.7)
  assert.equal(november.repayments, 3000)
})

test('October has the same closing balance before and after November begins', () => {
  const before = summarizeLoan(entries, range(10), new Date(2026, 9, 31, 23, 59, 59, 999))
  assert.deepEqual(before, summarizeLoan(entries, range(10), novemberNow))
})

test('All time includes initial debt separately and ignores future-dated entries', () => {
  const withFuture = [...entries, entry('2026-11-04T12:00:00', 'advance', 1000)]
  const summary = summarizeLoan(withFuture, null, novemberNow)
  assert.equal(summary.openingBalance, 0)
  assert.equal(summary.openingAdjustments, 15370.95)
  assert.equal(summary.closingBalance, 12520.7)
  assert.equal(summary.currentBalance, 12520.7)
})

test('Entries at custom interval boundaries are counted once with cent precision', () => {
  const from = new Date(2026, 10, 1, 10)
  const to = new Date(2026, 10, 1, 11)
  const summary = summarizeLoan([
    { occurredAt: new Date(from.getTime() - 1), kind: 'advance', amount: 0.1 },
    { occurredAt: from, kind: 'advance', amount: 0.2 },
    { occurredAt: to, kind: 'repayment', amount: 0.1 },
    { occurredAt: new Date(to.getTime() + 1), kind: 'advance', amount: 0.3 },
  ], { from, to }, novemberNow)
  assert.equal(summary.openingBalance, 0.1)
  assert.equal(summary.closingBalance, 0.2)
  assert.equal(summary.currentBalance, 0.5)
})

test('Imported party IDs preserve lender and borrower roles through linked accounts', () => {
  const mutual = { createdBy: 'boris-user', participants: [
    { accountId: 'boris-current' }, { accountId: 'anton-current' },
  ] }
  const ledger = { lenderAccountId: 'old-lender-id', entries: [
    { lenderAssetAccountId: 'boris-current' },
  ] }
  assert.equal(getLoanViewerRole(mutual, ledger, 'boris-user', ['boris-current']), 'lender')
  assert.equal(getLoanViewerRole(mutual, ledger, 'julia-user', ['boris-current']), 'lender')
  assert.equal(getLoanViewerRole(mutual, ledger, 'anton-user', ['anton-current']), 'borrower')
})
