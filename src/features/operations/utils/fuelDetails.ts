import type { FuelDetails, OperationAdditionalField } from '@/types'

const FUEL_TERMS = [
  'refuel',
  'fuel',
  'petrol',
  'gasoline',
  'car fuel',
  'заправ',
  'бензин',
  'топлив',
  'דלק',
]

export interface ParsedFuelDetails {
  details: FuelDetails
  complete: boolean
  issues: string[]
}

function asPositiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

export function isFuelOperationText(title: string, category: string) {
  const value = `${title} ${category}`.normalize('NFKC').toLocaleLowerCase()
  return FUEL_TERMS.some((term) => value.includes(term))
}

export function sanitizeFuelDetails(details?: FuelDetails | null): FuelDetails | undefined {
  if (!details) return undefined
  const unitPrice = asPositiveNumber(details.unitPrice)
  const liters = asPositiveNumber(details.liters)
  const odometerKm = asPositiveNumber(details.odometerKm)
  if (!unitPrice && !liters && !odometerKm) return undefined
  const sanitized: FuelDetails = { fullTank: details.fullTank !== false }
  if (unitPrice) sanitized.unitPrice = unitPrice
  if (liters) sanitized.liters = liters
  if (odometerKm) sanitized.odometerKm = odometerKm
  return sanitized
}

function removeDateTokens(comment: string) {
  return comment.replace(
    /\b(\d{1,2})[./-](\d{1,3})(?:[./-](\d{2,4}))?\b/g,
    (match, day, month, year) =>
      Number(day) <= 31 && Number(month) <= 12 && (year || Number(day) > 12)
        ? ' '
        : match
  )
}

function normalizePossibleLiters(value: number) {
  if (value >= 5 && value <= 100) return value
  if (Number.isInteger(value) && value >= 5_000 && value <= 100_000) {
    return value / 1_000
  }
  return undefined
}

export function parseLegacyFuelComment(
  comment: string,
  operationAmount?: number
): ParsedFuelDetails | null {
  const values = [...removeDateTokens(comment).matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((match) => Number(match[0].replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (values.length === 0) return null

  const issues: string[] = []
  const unitPriceIndex = values.findIndex((value) => value >= 3 && value <= 20)
  const unitPrice = unitPriceIndex >= 0 ? values[unitPriceIndex] : undefined
  const odometerCandidates = values
    .map((value, index) => ({ value, index }))
    .filter(({ value, index }) => index !== unitPriceIndex && value >= 1_000)
  const odometer = odometerCandidates.sort((first, second) => second.value - first.value)[0]

  const expectedLiters = unitPrice && operationAmount && operationAmount > 0
    ? operationAmount / unitPrice
    : undefined
  const literCandidates = values
    .map((value, index) => ({ value: normalizePossibleLiters(value), index }))
    .filter((candidate): candidate is { value: number; index: number } =>
      candidate.value !== undefined &&
      candidate.index !== unitPriceIndex &&
      candidate.index !== odometer?.index
    )
  const liters = literCandidates.sort((first, second) => {
    if (!expectedLiters) return second.index - first.index
    return Math.abs(first.value - expectedLiters) - Math.abs(second.value - expectedLiters)
  })[0]?.value || (
    expectedLiters && expectedLiters >= 5 && expectedLiters <= 100
      ? expectedLiters
      : undefined
  )

  if (!unitPrice) issues.push('Missing unit price')
  if (!odometer) issues.push('Missing odometer')
  if (!liters) issues.push('Missing liters')
  if (liters && expectedLiters && Math.abs(liters - expectedLiters) / expectedLiters > 0.12) {
    issues.push('Liters do not match operation amount')
  }

  const details = sanitizeFuelDetails({
    unitPrice,
    liters,
    odometerKm: odometer?.value,
    fullTank: true,
  })
  if (!details) return null
  return {
    details,
    complete: !!details.liters && !!details.odometerKm,
    issues,
  }
}

export function resolveFuelDetails(
  stored: FuelDetails | null | undefined,
  comment: string,
  operationAmount?: number,
  additionalFields: OperationAdditionalField[] = []
): ParsedFuelDetails | null {
  const additional = additionalFieldsToFuelDetails(additionalFields)
  const sanitizedAdditional = sanitizeFuelDetails(additional)
  if (sanitizedAdditional) {
    const issues: string[] = []
    if (!sanitizedAdditional.unitPrice) issues.push('Missing unit price')
    if (!sanitizedAdditional.odometerKm) issues.push('Missing odometer')
    if (!sanitizedAdditional.liters) issues.push('Missing liters')
    return {
      details: sanitizedAdditional,
      complete: !!sanitizedAdditional.liters && !!sanitizedAdditional.odometerKm,
      issues,
    }
  }
  const sanitized = sanitizeFuelDetails(stored)
  if (sanitized) {
    const issues: string[] = []
    if (!sanitized.unitPrice) issues.push('Missing unit price')
    if (!sanitized.odometerKm) issues.push('Missing odometer')
    if (!sanitized.liters) issues.push('Missing liters')
    return {
      details: sanitized,
      complete: !!sanitized.liters && !!sanitized.odometerKm,
      issues,
    }
  }
  return parseLegacyFuelComment(comment, operationAmount)
}

export function additionalFieldsToFuelDetails(
  fields: OperationAdditionalField[] = []
): FuelDetails | undefined {
  const normalizedUnit = (unit?: string) => unit?.trim().toLocaleLowerCase() || ''
  const numberValue = (field: OperationAdditionalField | undefined) =>
    typeof field?.value === 'number' ? field.value : Number(field?.value)
  const unitPriceField = fields.find((field) =>
    field.role === 'unitPrice' && (
      field.definitionId.startsWith('fuel-') ||
      normalizedUnit(field.unit).includes('/l')
    )
  )
  const litersField = fields.find((field) =>
    field.role === 'quantity' && (
      field.definitionId === 'fuel-quantity' ||
      ['l', 'liter', 'liters'].includes(normalizedUnit(field.unit))
    )
  )
  const odometerField = fields.find((field) =>
    field.role === 'cumulativeReading' && (
      field.definitionId === 'fuel-odometer' ||
      normalizedUnit(field.unit) === 'km'
    )
  )
  const fullTankField = fields.find((field) =>
    field.role === 'flag' && (
      field.definitionId === 'fuel-full-tank' ||
      field.label.toLocaleLowerCase().includes('full tank')
    )
  )
  return sanitizeFuelDetails({
    unitPrice: numberValue(unitPriceField),
    liters: numberValue(litersField),
    odometerKm: numberValue(odometerField),
    fullTank: fullTankField?.value === true,
  })
}
