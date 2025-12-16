// Currency exchange API configuration using environment variables
const API_KEY = import.meta.env.VITE_CURRENCY_API_KEY || '';
const API_BASE_URL = import.meta.env.VITE_CURRENCY_API_BASE_URL || 'https://v6.exchangerate-api.com/v6/';
const CRYPTO_API_KEY = import.meta.env.VITE_CRYPTO_API_KEY || '';
const CRYPTO_API_BASE_URL = import.meta.env.VITE_CRYPTO_API_BASE_URL || 'https://rest.coinapi.io/v1/exchangerate';

export async function getExchangeRate(from, to) {
  const API_URL = `${API_BASE_URL}${API_KEY}/latest/${from}`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const exchangeRates = data.conversion_rates;

    return exchangeRates.hasOwnProperty(to) ? exchangeRates[to] : "";
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getExchangeRates(cy) {
  const API_URL = `${API_BASE_URL}${API_KEY}/latest/${cy}`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    return data.conversion_rates;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getCryptoExchangeRate(baseCurrency, targetCurrency) {
  try {
    const response = await fetch(`${CRYPTO_API_BASE_URL}/${baseCurrency}/${targetCurrency}`, {
      method: 'GET',
      headers: {
        'X-CoinAPI-Key': CRYPTO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rate;

    return rate;
  } catch (error) {
    console.error(error);
    return null;
  }
}
