import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'my-money-1d617'
const APPLY = process.argv.includes('--apply')
const VERBOSE = process.argv.includes('--verbose')
const DATABASE = '(default)'
const DATABASE_NAME = `projects/${PROJECT_ID}/databases/${DATABASE}`
const DOCUMENTS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents`
const DATABASE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}`

function getAccessToken() {
  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'gcloud'
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'gcloud auth print-access-token']
    : ['auth', 'print-access-token']
  return execFileSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
  }).trim()
}

const accessToken = getAccessToken()
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`)
  }
  return response.status === 204 ? null : response.json()
}

async function listDocuments(path) {
  const documents = []
  let pageToken = ''
  do {
    const url = new URL(`${DOCUMENTS_BASE}/${path}`)
    url.searchParams.set('pageSize', '1000')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const page = await request(url)
    documents.push(...(page.documents || []))
    pageToken = page.nextPageToken || ''
  } while (pageToken)
  return documents
}

function decodeValue(value) {
  if (!value) return undefined
  if ('nullValue' in value) return null
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('booleanValue' in value) return value.booleanValue
  if ('timestampValue' in value) return new Date(value.timestampValue)
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue)
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {})
  return undefined
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]))
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  throw new Error(`Unsupported Firestore value: ${typeof value}`)
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]))
}

function documentId(document) {
  return document.name.split('/').pop()
}

function normalizeTitle(title) {
  return String(title || '').normalize('NFKC').trim().toLocaleLowerCase()
}

function deterministicCategoryId(normalizedTitle) {
  return `legacy-${createHash('sha256').update(normalizedTitle).digest('hex').slice(0, 20)}`
}

function ensureDesired(accountPlans, accountId, title) {
  const normalized = normalizeTitle(title)
  if (!normalized) return null
  if (!accountPlans.has(accountId)) accountPlans.set(accountId, new Map())
  const accountPlan = accountPlans.get(accountId)
  if (!accountPlan.has(normalized)) {
    accountPlan.set(normalized, {
      normalized,
      variants: new Map(),
      operationTypes: new Set(),
      parentCandidates: [],
      operations: [],
    })
  }
  const desired = accountPlan.get(normalized)
  const displayTitle = String(title).normalize('NFKC').trim()
  desired.variants.set(displayTitle, (desired.variants.get(displayTitle) || 0) + 1)
  return desired
}

function preferredTitle(variants) {
  return [...variants.entries()].sort((first, second) =>
    second[1] - first[1] || first[0].localeCompare(second[0])
  )[0]?.[0] || 'Uncategorized'
}

async function loadMigrationPlan() {
  const [accountDocs, userDocs] = await Promise.all([
    listDocuments('accounts'),
    listDocuments('users'),
  ])
  const accountPlans = new Map()
  const accountTitles = new Map(accountDocs.map((document) => [
    documentId(document),
    decodeFields(document.fields).title || documentId(document),
  ]))

  const userCategorySources = new Map()
  for (const userDocument of userDocs) {
    const userId = documentId(userDocument)
    const userData = decodeFields(userDocument.fields)
    const accountIds = (userData.accounts || []).map((account) => account?.id).filter(Boolean)
    const legacyCategories = await listDocuments(`users/${userId}/categories`)
    const sourceById = new Map(legacyCategories.map((document) => {
      const data = decodeFields(document.fields)
      return [documentId(document), { id: documentId(document), ...data }]
    }))
    userCategorySources.set(userId, sourceById)

    for (const legacyCategory of sourceById.values()) {
      for (const accountId of accountIds) {
        if (!accountTitles.has(accountId)) continue
        const desired = ensureDesired(accountPlans, accountId, legacyCategory.title)
        if (!desired) continue
        if (legacyCategory.parentCategoryId) {
          const parent = sourceById.get(legacyCategory.parentCategoryId)
          if (parent?.title) desired.parentCandidates.push(normalizeTitle(parent.title))
        }
      }
    }
  }

  for (const accountDocument of accountDocs) {
    const accountId = documentId(accountDocument)
    const assets = await listDocuments(`accounts/${accountId}/assets`)
    for (const asset of assets) {
      const assetId = documentId(asset)
      const operations = await listDocuments(`accounts/${accountId}/assets/${assetId}/operations`)
      for (const operationDocument of operations) {
        const operation = decodeFields(operationDocument.fields)
        if (
          !['payment', 'income'].includes(operation.type) ||
          operation.settlementId ||
          operation.loanEntryId ||
          !normalizeTitle(operation.category)
        ) continue

        const desired = ensureDesired(accountPlans, accountId, operation.category)
        desired.operationTypes.add(operation.type)
        desired.operations.push({
          name: operationDocument.name,
          currentCategoryId: operation.categoryId || null,
        })
      }
    }
  }

  const categoryCreates = []
  const operationUpdates = []
  const accountSummaries = []

  for (const [accountId, desiredByTitle] of accountPlans) {
    const existingDocuments = await listDocuments(`accounts/${accountId}/categories`)
    const existingByTitle = new Map(existingDocuments.map((document) => {
      const data = decodeFields(document.fields)
      return [normalizeTitle(data.title), { id: documentId(document), ...data }]
    }))
    const targetIdByTitle = new Map()
    for (const desired of desiredByTitle.values()) {
      targetIdByTitle.set(
        desired.normalized,
        existingByTitle.get(desired.normalized)?.id || deterministicCategoryId(desired.normalized)
      )
    }

    const newCategories = []
    for (const desired of desiredByTitle.values()) {
      const existing = existingByTitle.get(desired.normalized)
      const categoryId = targetIdByTitle.get(desired.normalized)
      const parentNormalized = desired.parentCandidates.find((candidate) =>
        candidate !== desired.normalized && targetIdByTitle.has(candidate)
      )
      const parentCategoryId = parentNormalized ? targetIdByTitle.get(parentNormalized) : null
      const operationTypes = desired.operationTypes
      const type = operationTypes.size === 0 || operationTypes.size > 1
        ? 'both'
        : operationTypes.has('income') ? 'income' : 'expense'
      const title = preferredTitle(desired.variants)

      if (!existing) {
        newCategories.push({
          id: categoryId,
          title,
          parentCategoryId,
          type,
          sortOrder: 0,
        })
      }
      for (const operation of desired.operations) {
        if (operation.currentCategoryId !== categoryId) {
          operationUpdates.push({ name: operation.name, categoryId })
        }
      }
    }

    const siblingGroups = new Map()
    newCategories.forEach((category) => {
      const key = category.parentCategoryId || 'root'
      siblingGroups.set(key, [...(siblingGroups.get(key) || []), category])
    })
    siblingGroups.forEach((siblings) => siblings
      .sort((first, second) => first.title.localeCompare(second.title))
      .forEach((category, index) => { category.sortOrder = index }))

    categoryCreates.push(...newCategories.map((category) => ({ accountId, ...category })))
    accountSummaries.push({
      accountId,
      title: accountTitles.get(accountId),
      existingCategories: existingDocuments.length,
      categoriesToCreate: newCategories.length,
      operationsToLink: [...desiredByTitle.values()].reduce(
        (total, desired) => total + desired.operations.filter((operation) =>
          operation.currentCategoryId !== targetIdByTitle.get(desired.normalized)
        ).length,
        0
      ),
    })
  }

  return { categoryCreates, operationUpdates, accountSummaries, legacyUsers: userCategorySources }
}

function categoryWrite(category) {
  return {
    update: {
      name: `${DATABASE_NAME}/documents/accounts/${category.accountId}/categories/${category.id}`,
      fields: encodeFields({
        title: category.title,
        parentCategoryId: category.parentCategoryId,
        type: category.type,
        sortOrder: category.sortOrder,
      }),
    },
    currentDocument: { exists: false },
  }
}

function operationWrite(operation) {
  return {
    update: {
      name: operation.name,
      fields: { categoryId: encodeValue(operation.categoryId) },
    },
    updateMask: { fieldPaths: ['categoryId'] },
  }
}

async function commitWrites(writes) {
  for (let index = 0; index < writes.length; index += 450) {
    await request(`${DATABASE_BASE}/documents:commit`, {
      method: 'POST',
      body: JSON.stringify({ writes: writes.slice(index, index + 450) }),
    })
  }
}

const plan = await loadMigrationPlan()
const legacyCategoryCount = [...plan.legacyUsers.values()].reduce(
  (total, categories) => total + categories.size,
  0
)

console.log(APPLY ? 'APPLY account category migration' : 'DRY RUN account category migration')
console.table(plan.accountSummaries)
console.log(`Legacy user category documents found: ${legacyCategoryCount}`)
console.log(`Account categories to create: ${plan.categoryCreates.length}`)
console.log(`Operations to link with categoryId: ${plan.operationUpdates.length}`)
if (VERBOSE) {
  for (const summary of plan.accountSummaries) {
    const categories = plan.categoryCreates
      .filter((category) => category.accountId === summary.accountId)
      .sort((first, second) => first.title.localeCompare(second.title))
    console.log(`\n${summary.title} (${summary.accountId})`)
    categories.forEach((category) => console.log(
      `  [${category.type}] ${category.title}${category.parentCategoryId ? ` -> ${category.parentCategoryId}` : ''}`
    ))
  }
}

if (APPLY) {
  await commitWrites(plan.categoryCreates.map(categoryWrite))
  await commitWrites(plan.operationUpdates.map(operationWrite))
  console.log('Migration applied successfully.')
} else {
  console.log('No data changed. Run with --apply to execute this plan.')
}
