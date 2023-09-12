export async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    const API_KEY = `aa6022439e0e4e7abb20d0c62de27f71`

    const response = await fetch(
      `https://open.er-api.com/v6/latest/${fromCurrency}/${toCurrency}`,
      {
        headers: {
          'apikey': API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`)
    }

    const data = await response.json()
    const exchangeRate = data.rate

    return exchangeRate

  } catch (error) {
    console.error('ErrorErrorError fetching exchange rate:', error)
    throw error
  }
}
