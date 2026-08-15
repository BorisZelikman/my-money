import type { OperationAdditionalField } from '@/types'
import type { LocatedOperation } from '../types'

interface MeasurementRecord {
  occurredAt: number
  amount: number
  field: OperationAdditionalField
  operation: LocatedOperation
  value: number
}

export interface MeasurementAnalytics {
  key: string
  category: string
  label: string
  unit: string
  aggregation: OperationAdditionalField['aggregation']
  role: OperationAdditionalField['role']
  operationCount: number
  latestValue: number
  result: number
  validIntervals: number
  skippedIntervals: number
  costPerUnit: number | null
}

function isNumericValue(value: OperationAdditionalField['value']): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getCategoryKey(operation: LocatedOperation) {
  return operation.categoryId || operation.category.trim().toLocaleLowerCase()
}

function getWeightedAverage(records: MeasurementRecord[]) {
  let weightedTotal = 0
  let totalWeight = 0

  records.forEach((record) => {
    const quantity = record.operation.additionalFields?.find((field) =>
      field.role === 'quantity' && isNumericValue(field.value) && field.value > 0
    )
    if (!quantity || !isNumericValue(quantity.value)) return
    weightedTotal += record.value * quantity.value
    totalWeight += quantity.value
  })

  if (totalWeight > 0) return weightedTotal / totalWeight
  return records.reduce((sum, record) => sum + record.value, 0) / records.length
}

function calculateCumulativeResult(records: MeasurementRecord[]) {
  let result = 0
  let intervalCost = 0
  let validIntervals = 0
  let skippedIntervals = 0

  for (let index = 1; index < records.length; index += 1) {
    const current = records[index]
    const previous = records[index - 1]
    const delta = current.value - previous.value
    if (delta <= 0) {
      skippedIntervals += 1
      continue
    }
    result += delta
    intervalCost += Math.abs(current.amount)
    validIntervals += 1
  }

  return {
    result,
    validIntervals,
    skippedIntervals,
    costPerUnit: result > 0 ? intervalCost / result : null,
  }
}

export function buildMeasurementAnalytics(
  operations: LocatedOperation[]
): MeasurementAnalytics[] {
  const groups = new Map<string, MeasurementRecord[]>()

  operations.forEach((operation) => {
    if (operation.settlementId || operation.loanEntryId) return
    operation.additionalFields?.forEach((field) => {
      if (field.type !== 'number' || !isNumericValue(field.value)) return
      // Fuel has interval-specific validation in the dedicated car panel.
      if (field.definitionId.startsWith('fuel-')) return

      const key = [
        operation.accountId,
        operation.assetId,
        getCategoryKey(operation),
        field.definitionId,
      ].join(':')
      const records = groups.get(key) || []
      records.push({
        occurredAt: operation.datetime.toMillis(),
        amount: Number(operation.amount) || 0,
        field,
        operation,
        value: field.value,
      })
      groups.set(key, records)
    })
  })

  return [...groups.entries()].map(([key, unsortedRecords]) => {
    const records = [...unsortedRecords].sort(
      (first, second) => first.occurredAt - second.occurredAt
    )
    const field = records[records.length - 1].field
    let result = records[records.length - 1].value
    let validIntervals = 0
    let skippedIntervals = 0
    let costPerUnit: number | null = null

    if (field.aggregation === 'sum') {
      result = records.reduce((sum, record) => sum + record.value, 0)
    } else if (field.aggregation === 'average') {
      result = field.role === 'unitPrice'
        ? getWeightedAverage(records)
        : records.reduce((sum, record) => sum + record.value, 0) / records.length
    } else if (field.aggregation === 'delta') {
      const cumulative = calculateCumulativeResult(records)
      result = cumulative.result
      validIntervals = cumulative.validIntervals
      skippedIntervals = cumulative.skippedIntervals
      costPerUnit = cumulative.costPerUnit
    }

    return {
      key,
      category: records[records.length - 1].operation.category || 'Uncategorized',
      label: field.label,
      unit: field.unit || '',
      aggregation: field.aggregation,
      role: field.role,
      operationCount: records.length,
      latestValue: records[records.length - 1].value,
      result,
      validIntervals,
      skippedIntervals,
      costPerUnit,
    }
  }).sort((first, second) =>
    first.category.localeCompare(second.category) || first.label.localeCompare(second.label)
  )
}
