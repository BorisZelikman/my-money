import type { Category } from '@/types'
import {
  isFuelOperationText,
  resolveFuelDetails,
} from '@/features/operations/utils/fuelDetails'
import type { LocatedOperation } from '../types'
import { getOperationCategoryPath } from './categoryAnalytics'

const MAX_INTERVAL_DAYS = 75

export interface CarAnalytics {
  operationCount: number
  totalCost: number
  costPerDay: number | null
  fuelCost: number
  fuelOperationCount: number
  averageUnitPrice: number | null
  latestOdometer: number | null
  trackedDistance: number
  litersPer100Km: number | null
  fuelCostPerKm: number | null
  validIntervals: number
  completeFuelRecords: number
  incompleteFuelRecords: number
  currentSegmentReadings: number
}

function normalize(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase()
}

function isCarOperation(operation: LocatedOperation, categories: Category[]) {
  const path = getOperationCategoryPath(operation, categories).map(normalize)
  return path.some((category) =>
    /^car(?:\s|$)/.test(category) ||
    category.includes('авто') ||
    category.includes('машин')
  ) || isFuelOperationText(operation.title, operation.category)
}

export function buildCarAnalytics(
  operations: LocatedOperation[],
  categories: Category[],
  dayCount: number | null
): CarAnalytics | null {
  const carOperations = operations.filter((operation) =>
    operation.type === 'payment' &&
    !operation.settlementId &&
    !operation.loanEntryId &&
    isCarOperation(operation, categories)
  )
  if (carOperations.length === 0) return null

  const fuelOperations = carOperations
    .filter((operation) =>
      !!operation.fuelDetails ||
      !!operation.additionalFields?.some((field) => field.definitionId.startsWith('fuel-')) ||
      isFuelOperationText(operation.title, operation.category)
    )
    .sort((first, second) => first.datetime.toMillis() - second.datetime.toMillis())

  let weightedPrice = 0
  let pricedLiters = 0
  let completeFuelRecords = 0
  let incompleteFuelRecords = 0
  let trackedDistance = 0
  let intervalLiters = 0
  let intervalCost = 0
  let validIntervals = 0
  let currentSegmentReadings = 0
  let latestOdometer: number | null = null
  let previous: {
    odometerKm: number
    occurredAt: number
  } | null = null

  fuelOperations.forEach((operation) => {
    const parsed = resolveFuelDetails(
      operation.fuelDetails,
      operation.comment || '',
      Number(operation.amount) || 0,
      operation.additionalFields
    )
    const details = parsed?.details
    if (details?.unitPrice && details.liters) {
      weightedPrice += details.unitPrice * details.liters
      pricedLiters += details.liters
    }
    if (details?.odometerKm) {
      latestOdometer = Math.max(latestOdometer || 0, details.odometerKm)
    }

    if (
      !parsed?.complete ||
      !details?.odometerKm ||
      !details.liters ||
      details.fullTank === false
    ) {
      incompleteFuelRecords += 1
      previous = null
      currentSegmentReadings = 0
      return
    }

    completeFuelRecords += 1
    const occurredAt = operation.datetime.toMillis()
    if (previous) {
      const distance = details.odometerKm - previous.odometerKm
      const elapsedDays = (occurredAt - previous.occurredAt) / 86_400_000
      const consumption = distance > 0 ? (details.liters / distance) * 100 : 0
      if (
        elapsedDays > 0 &&
        elapsedDays <= MAX_INTERVAL_DAYS &&
        distance >= 30 &&
        distance <= 2_000 &&
        consumption >= 2 &&
        consumption <= 30
      ) {
        trackedDistance += distance
        intervalLiters += details.liters
        intervalCost += Number(operation.amount) || details.liters * (details.unitPrice || 0)
        validIntervals += 1
        currentSegmentReadings += 1
      } else {
        currentSegmentReadings = 1
      }
    } else {
      currentSegmentReadings = 1
    }
    previous = { odometerKm: details.odometerKm, occurredAt }
  })

  const totalCost = carOperations.reduce(
    (sum, operation) => sum + (Number(operation.amount) || 0),
    0
  )
  const fuelCost = fuelOperations.reduce(
    (sum, operation) => sum + (Number(operation.amount) || 0),
    0
  )

  return {
    operationCount: carOperations.length,
    totalCost,
    costPerDay: dayCount ? totalCost / dayCount : null,
    fuelCost,
    fuelOperationCount: fuelOperations.length,
    averageUnitPrice: pricedLiters > 0 ? weightedPrice / pricedLiters : null,
    latestOdometer,
    trackedDistance,
    litersPer100Km: trackedDistance > 0 ? (intervalLiters / trackedDistance) * 100 : null,
    fuelCostPerKm: trackedDistance > 0 ? intervalCost / trackedDistance : null,
    validIntervals,
    completeFuelRecords,
    incompleteFuelRecords,
    currentSegmentReadings,
  }
}
