import type {
  BankTransaction,
  ReconciliationOperation,
  ReconciliationRow,
} from '../types'

const DAY_MS = 86_400_000

function signedOperationAmount(operation: ReconciliationOperation) {
  if (operation.type === 'payment') return -Math.abs(operation.amount)
  if (operation.type === 'income') return Math.abs(operation.amount)
  if (operation.loanDirection === 'outgoing' || operation.settlementDirection === 'outgoing') {
    return -Math.abs(operation.amount)
  }
  if (operation.loanDirection === 'incoming' || operation.settlementDirection === 'incoming') {
    return Math.abs(operation.amount)
  }
  const description = normalize(`${operation.title} ${operation.category}`)
  if (/repay|repayment|возврат|погашен|החזר/i.test(description)) {
    return Math.abs(operation.amount)
  }
  if (/loan advance|lend|выдан|заем|займ|הלוואה/i.test(description)) {
    return -Math.abs(operation.amount)
  }
  return 0
}

function localDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
}

function dayDifference(left: Date, right: Date) {
  return Math.round(Math.abs(localDay(left) - localDay(right)) / DAY_MS)
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ' ').trim()
}

function semanticScore(bank: BankTransaction, operation: ReconciliationOperation) {
  const bankText = normalize(bank.description)
  const appText = normalize(`${operation.title} ${operation.category} ${operation.comment}`)
  let score = 0

  const bankTokens = new Set(bankText.split(' ').filter((token) => token.length > 2))
  appText.split(' ').forEach((token) => {
    if (token.length > 2 && bankTokens.has(token)) score += 2
  })

  const pairs = [
    [/avdor|авдор|אבדור/i, /אבדור/i],
    [/rent|аренд|ёнатан|יונתן/i, /שכירות|יונתן|שיק/i],
    [/repay|возврат|anton|антон/i, /סביצקי|החזר|זיכוי/i],
    [/loan|lend|антон|anton/i, /סביצקי|העברה/i],
    [/vat|ндс|מע["״]?מ/i, /מע["״]?מ|שובר/i],
  ] as const
  pairs.forEach(([appPattern, bankPattern]) => {
    if (appPattern.test(appText) && bankPattern.test(bankText)) score += 5
  })
  return score
}

function cents(value: number) {
  return Math.round(value * 100)
}

export function reconcileOperations(
  bankTransactions: BankTransaction[],
  operations: ReconciliationOperation[]
): ReconciliationRow[] {
  const availableOperations = new Set(operations.map((operation) => operation.id))
  const rows: ReconciliationRow[] = []

  bankTransactions.forEach((bank) => {
    if (bank.isCardSettlement) {
      rows.push({ id: bank.id, status: 'card-settlement', bank, operation: null })
      return
    }

    const candidates = operations
      .filter((operation) => availableOperations.has(operation.id))
      .map((operation) => ({
        operation,
        days: dayDifference(bank.date, operation.datetime.toDate()),
        amountMatches: cents(bank.amount) === cents(signedOperationAmount(operation)),
        semantics: semanticScore(bank, operation),
      }))
      .filter((candidate) => candidate.amountMatches && candidate.days <= 3)
      .sort((left, right) =>
        left.days - right.days || right.semantics - left.semantics
      )

    const best = candidates[0]
    if (!best) {
      rows.push({ id: bank.id, status: 'bank-only', bank, operation: null })
      return
    }

    availableOperations.delete(best.operation.id)
    rows.push({
      id: `${bank.id}:${best.operation.id}`,
      status: best.days === 0 ? 'matched' : 'near-match',
      bank,
      operation: best.operation,
      dayDifference: best.days,
    })
  })

  operations
    .filter((operation) => availableOperations.has(operation.id))
    .forEach((operation) => rows.push({
      id: `app-${operation.id}`,
      status: 'app-only',
      bank: null,
      operation,
    }))

  return rows.sort((left, right) => {
    const leftDate = left.bank?.date || left.operation?.datetime.toDate() || new Date(0)
    const rightDate = right.bank?.date || right.operation?.datetime.toDate() || new Date(0)
    return rightDate.getTime() - leftDate.getTime()
  })
}
