export interface Currency {
  id: string
  title: string
  short: string
  symbol: string
}

export const DEFAULT_CURRENCIES: Record<string, Currency> = {
  ILS: { id: 'ils', title: 'Israeli Shekel', short: 'ILS', symbol: '₪' },
  USD: { id: 'usd', title: 'US Dollar', short: 'USD', symbol: '$' },
  EUR: { id: 'eur', title: 'Euro', short: 'EUR', symbol: '€' },
  RUB: { id: 'rub', title: 'Russian Ruble', short: 'RUB', symbol: '₽' },
  GBP: { id: 'gbp', title: 'British Pound', short: 'GBP', symbol: '£' },
}

