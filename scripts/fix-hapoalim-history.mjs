import { execFileSync, execSync } from 'node:child_process'

const PROJECT_ID = 'my-money-1d617'
const DATABASE = '(default)'
const ACCOUNT_ID = 'CCPio4epoOWC6VYdyGjy'
const ASSET_ID = 'daJdl3aabOUXjSWwRvfo'
const DATABASE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}`
const DOCUMENTS_BASE = `${DATABASE_BASE}/documents`
const apply = process.argv.includes('--apply')

const duplicateSalaryId = 'smKAaPrfZWVyUtStU8kA'
const rentCorrections = [
  {
    id: '4iXYqf2Hd5MIUenJK8De',
    comment: 'аренда июль',
    datetime: '2024-07-01T09:00:00.000Z',
  },
  {
    id: '29amFcQcjJz6GWd4ngvW',
    comment: 'аренда август',
    datetime: '2024-08-01T09:00:00.000Z',
  },
]

function accessToken() {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) return process.env.GOOGLE_OAUTH_ACCESS_TOKEN
  if (process.platform === 'win32') {
    return execSync('gcloud auth print-access-token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  }
  const executable = 'gcloud'
  return execFileSync(executable, ['auth', 'print-access-token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

const token = accessToken()

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (response.status === 404) return null
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const details = body?.error?.details?.map((detail) =>
      detail?.metadata?.quota_metric || detail?.reason
    ).filter(Boolean).join(', ')
    throw new Error(`${response.status} ${body?.error?.message || response.statusText}${
      details ? ` (${details})` : ''
    }`)
  }
  return body
}

function operationUrl(id) {
  return `${DOCUMENTS_BASE}/accounts/${ACCOUNT_ID}/assets/${ASSET_ID}/operations/${id}`
}

function operationName(id) {
  return `projects/${PROJECT_ID}/databases/${DATABASE}/documents/accounts/${ACCOUNT_ID}/assets/${ASSET_ID}/operations/${id}`
}

const assetUrl = `${DOCUMENTS_BASE}/accounts/${ACCOUNT_ID}/assets/${ASSET_ID}`
const assetName = `projects/${PROJECT_ID}/databases/${DATABASE}/documents/accounts/${ACCOUNT_ID}/assets/${ASSET_ID}`

function numberField(field) {
  if (!field) return Number.NaN
  return Number(field.doubleValue ?? field.integerValue)
}

function stringField(field) {
  return field?.stringValue || ''
}

function assertOperation(document, expected) {
  const fields = document.fields || {}
  if (numberField(fields.amount) !== expected.amount ||
      stringField(fields.type) !== expected.type ||
      (expected.comment && stringField(fields.comment) !== expected.comment)) {
    throw new Error(`Operation ${document.name} no longer matches the approved correction.`)
  }
}

async function main() {
  const [asset, duplicate, ...rents] = await Promise.all([
    request(assetUrl),
    request(operationUrl(duplicateSalaryId)),
    ...rentCorrections.map((correction) => request(operationUrl(correction.id))),
  ])
  if (!asset) throw new Error('Target asset was not found.')

  const writes = []
  if (duplicate) {
    assertOperation(duplicate, { amount: 23600, type: 'income', comment: 'December' })
    const currentAmount = numberField(asset.fields?.amount)
    if (!Number.isFinite(currentAmount)) throw new Error('Asset balance is not numeric.')
    writes.push({
      delete: operationName(duplicateSalaryId),
      currentDocument: { updateTime: duplicate.updateTime },
    })
    writes.push({
      update: {
        name: assetName,
        fields: { amount: { doubleValue: currentAmount - 23600 } },
      },
      updateMask: { fieldPaths: ['amount'] },
      currentDocument: { updateTime: asset.updateTime },
    })
  }

  rents.forEach((rent, index) => {
    const correction = rentCorrections[index]
    if (!rent) throw new Error(`Rent operation ${correction.id} was not found.`)
    assertOperation(rent, { amount: 6200, type: 'payment', comment: correction.comment })
    if (rent.fields?.datetime?.timestampValue === correction.datetime) return
    writes.push({
      update: {
        name: operationName(correction.id),
        fields: { datetime: { timestampValue: correction.datetime } },
      },
      updateMask: { fieldPaths: ['datetime'] },
      currentDocument: { updateTime: rent.updateTime },
    })
  })

  console.log(`Planned writes: ${writes.length}`)
  console.log(`Duplicate salary: ${duplicate ? 'delete and reverse 23,600 ILS' : 'already absent'}`)
  rentCorrections.forEach((correction, index) => {
    console.log(`${correction.comment}: ${rents[index]?.fields?.datetime?.timestampValue} -> ${correction.datetime}`)
  })

  if (!apply) {
    console.log('Dry run only. Run with --apply to commit.')
    return
  }
  if (writes.length === 0) {
    console.log('No changes needed.')
    return
  }
  await request(`${DATABASE_BASE}/documents:commit`, {
    method: 'POST',
    body: JSON.stringify({ writes }),
  })
  console.log('Firestore correction committed atomically.')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
