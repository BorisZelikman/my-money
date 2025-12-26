import { DEFAULT_CURRENCIES, type Currency } from '@/types'

export function getCurrencySymbol(currencyCode: string): string {
  return DEFAULT_CURRENCIES[currencyCode]?.symbol || currencyCode
}

export function getCurrency(currencyCode: string): Currency | undefined {
  return DEFAULT_CURRENCIES[currencyCode]
}

export function formatAmount(
  amount: number,
  currencyCode: string,
  options?: {
    showSymbol?: boolean
    decimals?: number
  }
): string {
  const { showSymbol = true, decimals = 2 } = options || {}
  const symbol = getCurrencySymbol(currencyCode)
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount))
  
  const sign = amount < 0 ? '-' : ''
  
  if (showSymbol) {
    // Put symbol before or after based on currency
    if (['USD', 'GBP', 'EUR'].includes(currencyCode)) {
      return `${sign}${symbol}${formatted}`
    }
    return `${sign}${formatted} ${symbol}`
  }
  
  return `${sign}${formatted}`
}

export function formatAmountWithColor(amount: number): {
  formatted: string
  isNegative: boolean
  isPositive: boolean
} {
  return {
    formatted: formatAmount(amount, ''),
    isNegative: amount < 0,
    isPositive: amount > 0,
  }
}

