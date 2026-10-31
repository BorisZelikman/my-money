import { execSync } from 'node:child_process'
import assert from 'node:assert/strict'

const base = 'https://firestore.googleapis.com/v1/projects/my-money-1d617/databases/(default)/documents'
const path = 'mutuals/VRe5n9Y44CobTL1Xpq72/settlements/mE7oQpu8jaHOEbFlZhEf'
const periodFrom = '2026-08-01'
const periodTo = '2026-09-30'
const apply = process.argv.includes('--apply')
const token = execSync('gcloud auth print-access-token', {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
}).trim()

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`)
  return response.json()
}

const original = await request(`${base}/${path}`)
const fields = original.fields
assert.equal(Number(fields.amount.doubleValue ?? fields.amount.integerValue), 5076)
assert.equal(fields.appliedAt.timestampValue, '2026-10-06T09:00:00Z')
assert.equal(fields.fromAccountId.stringValue, 'esxcFwEYGYr0P0HdniHS')
assert.equal(fields.toAccountId.stringValue, 'CCPio4epoOWC6VYdyGjy')

const linkedPaths = [
  `accounts/${fields.fromAccountId.stringValue}/assets/${fields.fromAssetId.stringValue}`,
  `accounts/${fields.toAccountId.stringValue}/assets/${fields.toAssetId.stringValue}`,
]
const operationPaths = [
  `${linkedPaths[0]}/operations/${fields.sourceOperationId.stringValue}`,
  `${linkedPaths[1]}/operations/${fields.targetOperationId.stringValue}`,
]
const linkedBefore = await Promise.all([...linkedPaths, ...operationPaths].map((item) => request(`${base}/${item}`)))
console.log(JSON.stringify({ settlementId: path.split('/').pop(), amount: 5076,
  transferDate: fields.appliedAt.timestampValue, periodFrom, periodTo, apply }))

if (apply && (fields.periodFrom?.stringValue !== periodFrom || fields.periodTo?.stringValue !== periodTo)) {
  assert.ok(!fields.periodFrom && !fields.periodTo, 'A different period has already been assigned.')
  await request(`${base}:commit`, {
    method: 'POST',
    body: JSON.stringify({ writes: [{
      update: { name: original.name, fields: {
        periodFrom: { stringValue: periodFrom }, periodTo: { stringValue: periodTo },
      } },
      updateMask: { fieldPaths: ['periodFrom', 'periodTo'] },
      currentDocument: { updateTime: original.updateTime },
    }] }),
  })
  const after = await request(`${base}/${path}`)
  const { periodFrom: from, periodTo: to, ...unchangedFields } = after.fields
  assert.equal(from.stringValue, periodFrom)
  assert.equal(to.stringValue, periodTo)
  assert.deepEqual(unchangedFields, fields)
  const linkedAfter = await Promise.all([...linkedPaths, ...operationPaths].map((item) => request(`${base}/${item}`)))
  assert.deepEqual(linkedAfter, linkedBefore)
  console.log('Period assigned. Settlement amount, transfer date, linked operations and asset balances are unchanged.')
} else {
  console.log(apply ? 'Period is already assigned.' : 'Dry run only. Run with --apply to assign the confirmed period.')
}
