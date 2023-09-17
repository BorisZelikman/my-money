import apiConfig from "../config/currency-converter-api-key.json"

export async function getExchangeRate(from, to) {
  const API_KEY = apiConfig.currencyConverterApiKey
  const API_URL = `${apiConfig.apiBaseUrl}${API_KEY}/latest/${from}`

  try {
    const response = await fetch(API_URL)
    const data = await response.json()
    const exchangeRates = data.conversion_rates

    return exchangeRates.hasOwnProperty(to) ? exchangeRates[to] : ""
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getExchangeRates(cy) {
  const API_KEY = apiConfig.currencyConverterApiKey
  const API_URL = `${apiConfig.apiBaseUrl}${API_KEY}/latest/${cy}`

  try {
    const response = await fetch(API_URL)
    const data = await response.json()

    return data.conversion_rates
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getCryptoExchangeRate(baseCurrency, targetCurrency) {
  const API_KEY = apiConfig.cryptoConverterApiKey
  const API_URL = apiConfig.cryptoApiBaseUrl

  try {
    const response = await fetch(`${API_URL}/${baseCurrency}/${targetCurrency}`, {
      method: 'GET',
      headers: {
        'X-CoinAPI-Key': API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    const rate = data.rate

    return rate
  } catch (error) {
    console.error(error)
    return null
  }
}