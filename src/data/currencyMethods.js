import apiConfig from "../config/currency-converter-api-key.json"

export async function getExchangeRate(from, to) {
    const API_KEY = apiConfig.currencyConverterApiKey;
    const API_URL = `${apiConfig.apiBaseUrl}${API_KEY}/pair/${from}/${to}`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("api", data.conversion_rate)
        return  data.conversion_rate;
    } catch (error) {
        console.error(error)
        return []
    }
}

export function getCurrencySymbol(currencies, shortName) {
    const symbol = currencies.find(c=>c.short===shortName);
    return symbol?symbol:"";
}
