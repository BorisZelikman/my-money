import type { CategoryFieldDefinition } from '@/types'

export type CategoryFieldPreset = 'fuel' | 'electricity' | 'water'

const PRESETS: Record<CategoryFieldPreset, CategoryFieldDefinition[]> = {
  fuel: [
    {
      id: 'fuel-unit-price',
      label: 'Price / liter',
      type: 'number',
      unit: 'ILS/L',
      required: false,
      role: 'unitPrice',
      aggregation: 'average',
    },
    {
      id: 'fuel-quantity',
      label: 'Liters',
      type: 'number',
      unit: 'L',
      required: false,
      role: 'quantity',
      aggregation: 'sum',
    },
    {
      id: 'fuel-odometer',
      label: 'Odometer',
      type: 'number',
      unit: 'km',
      required: false,
      role: 'cumulativeReading',
      aggregation: 'delta',
    },
    {
      id: 'fuel-full-tank',
      label: 'Full tank',
      type: 'boolean',
      required: false,
      role: 'flag',
      aggregation: 'last',
    },
  ],
  electricity: [
    {
      id: 'electricity-meter-reading',
      label: 'Meter reading',
      type: 'number',
      unit: 'kWh',
      required: true,
      role: 'cumulativeReading',
      aggregation: 'delta',
    },
    {
      id: 'electricity-tariff',
      label: 'Tariff',
      type: 'number',
      unit: 'ILS/kWh',
      required: false,
      role: 'unitPrice',
      aggregation: 'average',
    },
  ],
  water: [
    {
      id: 'water-meter-reading',
      label: 'Meter reading',
      type: 'number',
      unit: 'm3',
      required: true,
      role: 'cumulativeReading',
      aggregation: 'delta',
    },
    {
      id: 'water-tariff',
      label: 'Tariff',
      type: 'number',
      unit: 'ILS/m3',
      required: false,
      role: 'unitPrice',
      aggregation: 'average',
    },
  ],
}

export function getCategoryFieldPreset(preset: CategoryFieldPreset) {
  return PRESETS[preset].map((field) => ({ ...field }))
}

export function createCategoryFieldDefinition(): CategoryFieldDefinition {
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    type: 'number',
    required: false,
    role: 'quantity',
    aggregation: 'sum',
  }
}
