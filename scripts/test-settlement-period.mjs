import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/features/mutuals/utils/settlementPeriod.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
})
const { settlementMatchesPeriod, isValidSettlementPeriod } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)
const settlement = {
  periodFrom: '2026-08-01', periodTo: '2026-09-30',
  appliedAt: new Date('2026-10-06T09:00:00Z'),
}
const range = (year, month, lastDay) => ({
  from: new Date(year, month - 1, 1),
  to: new Date(year, month - 1, lastDay, 23, 59, 59, 999),
})

test('October does not include the August-September settlement paid in October', () => {
  assert.equal(settlementMatchesPeriod(settlement, range(2026, 10, 31)), false)
  const debt = 10544.91 * 0.6 - 8671.14 +
    (settlementMatchesPeriod(settlement, range(2026, 10, 31)) ? 5076 : 0)
  assert.equal(Math.round(debt * 100) / 100, -2344.19)
})

test('The complete August-September period includes the settlement once', () => {
  assert.equal(settlementMatchesPeriod(settlement, {
    from: new Date(2026, 7, 1), to: new Date(2026, 8, 30, 23, 59, 59, 999),
  }), true)
  assert.equal(settlementMatchesPeriod(settlement, range(2026, 8, 31)), false)
  assert.equal(settlementMatchesPeriod(settlement, range(2026, 9, 30)), false)
  assert.equal(settlementMatchesPeriod(settlement, null), true)
})

test('A period ending today is included even if its transfer happened later', () => {
  assert.equal(settlementMatchesPeriod({ ...settlement, periodFrom: '2026-10-01', periodTo: '2026-10-31' }, {
    from: new Date(2026, 9, 1), to: new Date(2026, 9, 31, 8),
  }), true)
})

test('Old records keep their date-based behavior until assigned', () => {
  const legacy = { appliedAt: settlement.appliedAt }
  assert.equal(settlementMatchesPeriod(legacy, range(2026, 10, 31)), true)
  assert.equal(settlementMatchesPeriod(legacy, range(2026, 9, 30)), false)
})

test('Period validation rejects reversed ranges and impossible dates', () => {
  assert.equal(isValidSettlementPeriod(settlement), true)
  for (const invalid of [
    { periodFrom: '2026-09-30', periodTo: '2026-08-01' },
    { periodFrom: '2026-02-30', periodTo: '2026-03-01' },
    { periodFrom: '', periodTo: '2026-03-01' },
  ]) assert.equal(isValidSettlementPeriod(invalid), false)
})
