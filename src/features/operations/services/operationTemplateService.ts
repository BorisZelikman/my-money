import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type {
  Operation,
  OperationTemplate,
  OperationTemplateInput,
} from '@/types'
import { getOperationsByAssetId } from './operationService'

const TEMPLATE_VERSION = 1
const USERS_COLLECTION = 'users'
const TEMPLATES_COLLECTION = 'operationTemplates'

export interface TemplateAssetLocation {
  accountId: string
  assetId: string
}

interface CanonicalTitle {
  key: string
  icon: string
}

interface StoredOperationTemplate {
  type: 'payment' | 'income'
  canonicalKey: string
  title: string
  aliases: string[]
  icon: string
  accountId: string
  assetId: string
  category: string
  purposeId?: string
  lastAmount: number
  useCount: number
  firstUsedAt: Timestamp
  lastUsedAt: Timestamp
}

const canonicalRules: Array<{
  key: string
  icon: string
  terms: string[]
}> = [
  { key: 'rami-levi', icon: '🛒', terms: ['rami levi', 'rami levy', 'рами леви', 'רמי לוי'] },
  { key: 'car-fuel', icon: '⛽', terms: ['refuel', 'petrol', 'gasoline', 'fuel', 'заправка', 'бензин', 'דלק'] },
  { key: 'car-insurance', icon: '🛡️', terms: ['car insurance', 'auto insurance', 'страховка авто', 'страхование авто', 'ביטוח רכב'] },
  { key: 'pharmacy', icon: '💊', terms: ['pharmacy', 'drugstore', 'аптека', 'בית מרקחת'] },
  { key: 'restaurant', icon: '🍽️', terms: ['restaurant', 'ресторан', 'מסעדה'] },
  { key: 'coffee', icon: '☕', terms: ['coffee', 'кофе', 'קפה'] },
  { key: 'rent', icon: '🏠', terms: ['rent', 'аренда', 'שכר דירה'] },
  { key: 'electricity', icon: '⚡', terms: ['electricity', 'электричество', 'חשמל'] },
  { key: 'water', icon: '💧', terms: ['water bill', 'вода', 'מים'] },
  { key: 'internet', icon: '📶', terms: ['internet', 'интернет', 'אינטרנט'] },
  { key: 'parking', icon: '🅿️', terms: ['parking', 'парковка', 'חניה'] },
  { key: 'public-transport', icon: '🚌', terms: ['public transport', 'transport', 'транспорт', 'תחבורה'] },
  { key: 'salary', icon: '💰', terms: ['salary', 'paycheck', 'зарплата', 'משכורת'] },
  { key: 'subscription', icon: '🔁', terms: ['subscription', 'подписка', 'מנוי'] },
]

export function normalizeOperationTitle(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferCanonicalTitle(title: string, category: string): CanonicalTitle {
  const normalizedTitle = normalizeOperationTitle(title)
  const searchable = `${normalizedTitle} ${normalizeOperationTitle(category)}`.trim()
  const rule = canonicalRules.find(({ terms }) =>
    terms.some((term) => searchable.includes(normalizeOperationTitle(term)))
  )

  if (rule) return { key: rule.key, icon: rule.icon }
  return {
    key: normalizedTitle || 'untitled',
    icon: '🧾',
  }
}

function hashSignature(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function buildTemplateIdentity(input: OperationTemplateInput) {
  const canonical = inferCanonicalTitle(input.title, input.category)
  const signature = [
    TEMPLATE_VERSION,
    input.type,
    canonical.key,
    input.accountId,
    input.assetId,
    input.purposeId || '',
  ].join('|')

  return {
    id: `v${TEMPLATE_VERSION}-${hashSignature(signature)}`,
    canonical,
  }
}

function toStoredTemplate(
  input: OperationTemplateInput,
  useCount = 1,
  firstUsedAt = input.datetime
): StoredOperationTemplate {
  const { canonical } = buildTemplateIdentity(input)
  const stored: StoredOperationTemplate = {
    type: input.type,
    canonicalKey: canonical.key,
    title: input.title.trim(),
    aliases: [input.title.trim()],
    icon: canonical.icon,
    accountId: input.accountId,
    assetId: input.assetId,
    category: input.category.trim(),
    lastAmount: input.amount,
    useCount,
    firstUsedAt: Timestamp.fromDate(firstUsedAt),
    lastUsedAt: Timestamp.fromDate(input.datetime),
  }
  if (input.purposeId) stored.purposeId = input.purposeId
  return stored
}

function operationToInput(
  accountId: string,
  assetId: string,
  operation: Operation
): OperationTemplateInput | null {
  if (
    (operation.type !== 'payment' && operation.type !== 'income') ||
    operation.settlementId ||
    operation.loanEntryId ||
    !operation.title?.trim()
  ) {
    return null
  }

  return {
    type: operation.type,
    title: operation.title,
    amount: operation.amount,
    category: operation.category || '',
    datetime: operation.datetime.toDate(),
    accountId,
    assetId,
    purposeId: operation.purposeId,
  }
}

export async function getOperationTemplates(userId: string): Promise<OperationTemplate[]> {
  const snapshot = await getDocs(
    collection(db, USERS_COLLECTION, userId, TEMPLATES_COLLECTION)
  )

  return snapshot.docs.map((templateDoc) => {
    const data = templateDoc.data() as StoredOperationTemplate
    return {
      id: templateDoc.id,
      ...data,
      firstUsedAt: data.firstUsedAt.toDate(),
      lastUsedAt: data.lastUsedAt.toDate(),
    }
  }).sort((first, second) => second.lastUsedAt.getTime() - first.lastUsedAt.getTime())
}

export async function initializeOperationTemplates(
  userId: string,
  assets: TemplateAssetLocation[]
): Promise<boolean> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  const userSnapshot = await getDoc(userRef)
  if (!userSnapshot.exists()) return false
  if ((userSnapshot.data().operationTemplatesVersion || 0) >= TEMPLATE_VERSION) return false

  const operationGroups = await Promise.all(
    assets.map(async (asset) => ({
      ...asset,
      operations: await getOperationsByAssetId(asset.accountId, asset.assetId),
    }))
  )

  const grouped = new Map<string, OperationTemplateInput[]>()
  operationGroups.forEach(({ accountId, assetId, operations }) => {
    operations.forEach((operation) => {
      if (operation.userId !== userId) return
      const input = operationToInput(accountId, assetId, operation)
      if (!input) return
      const { id } = buildTemplateIdentity(input)
      const existing = grouped.get(id) || []
      existing.push(input)
      grouped.set(id, existing)
    })
  })

  const writes = Array.from(grouped.entries()).map(([id, entries]) => {
    const ordered = [...entries].sort(
      (first, second) => first.datetime.getTime() - second.datetime.getTime()
    )
    const oldest = ordered[0]
    const newest = ordered[ordered.length - 1]
    const aliases = Array.from(new Set(ordered.map((entry) => entry.title.trim())))
    return {
      id,
      data: {
        ...toStoredTemplate(newest, ordered.length, oldest.datetime),
        aliases,
      },
    }
  })

  for (let offset = 0; offset < writes.length; offset += 450) {
    const batch = writeBatch(db)
    writes.slice(offset, offset + 450).forEach(({ id, data }) => {
      batch.set(doc(db, USERS_COLLECTION, userId, TEMPLATES_COLLECTION, id), data)
    })
    await batch.commit()
  }

  await updateDoc(userRef, { operationTemplatesVersion: TEMPLATE_VERSION })
  return true
}

export async function recordOperationTemplate(
  userId: string,
  input: OperationTemplateInput
): Promise<void> {
  const { id } = buildTemplateIdentity(input)
  const templateRef = doc(db, USERS_COLLECTION, userId, TEMPLATES_COLLECTION, id)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(templateRef)
    if (!snapshot.exists()) {
      transaction.set(templateRef, toStoredTemplate(input))
      return
    }

    const existing = snapshot.data() as StoredOperationTemplate
    const aliases = Array.from(new Set([...existing.aliases, input.title.trim()]))
    const update: Partial<StoredOperationTemplate> = {
      title: input.title.trim(),
      aliases,
      category: input.category.trim(),
      lastAmount: input.amount,
      lastUsedAt: Timestamp.fromDate(input.datetime),
      useCount: (existing.useCount || 0) + 1,
    }
    if (input.purposeId) update.purposeId = input.purposeId
    transaction.update(templateRef, update)
  })
}

export async function safelyRecordOperationTemplate(
  userId: string,
  input: OperationTemplateInput
) {
  try {
    await recordOperationTemplate(userId, input)
  } catch (error) {
    logger.warn('Operation saved, but its suggestion template was not updated.', error)
  }
}

