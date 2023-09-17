import apiConfig from "../config/currency-converter-api-key.json"

export async function getExchangeRate(from, to) {
    const API_KEY = apiConfig.currencyConverterApiKey;
    const API_URL = `${apiConfig.apiBaseUrl}${API_KEY}/pair/${from}/${to}`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return  data.conversion_rate;
    } catch (error) {
        console.error(error);
        return 1;
    }
}

export function getCurrencySymbol(currencies, shortName) {
    const symbol = currencies.find(c=>c.short===shortName)?.symbol;
    return symbol?symbol:"";
}
export function getCurrencyOfAsset(assets, assetId) {
    const shortName = assets?.find(a=>a.id===assetId).currency;
    return shortName?shortName:"";
}
export function getCurrencySymbolOfAsset(assets, assetId, currencies) {
    const shortName = assets?.find(a=>a.id===assetId).currency;
    return getCurrencySymbol(currencies, shortName)
}
