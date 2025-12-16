// Currency exchange API configuration using environment variables
const API_KEY = import.meta.env.VITE_CURRENCY_API_KEY || '';
const API_BASE_URL = import.meta.env.VITE_CURRENCY_API_BASE_URL || 'https://v6.exchangerate-api.com/v6/';

export async function getExchangeRate(from, to) {
    const API_URL = `${API_BASE_URL}${API_KEY}/pair/${from}/${to}`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data.conversion_rate;
    } catch (error) {
        console.error(error);
        return 1;
    }
}

export function getCurrencySymbol(currencies, shortName) {
    const symbol = currencies?.find(c => c.short === shortName)?.symbol;
    return symbol ? symbol : "";
}

export function getCurrencyOfAsset(assets, assetId) {
    const shortName = assets?.find(a => a.id === assetId).currency;
    return shortName ? shortName : "";
}

export function getCurrencySymbolOfAsset(assets, assetId, currencies) {
    const shortName = assets?.find(a => a.id === assetId)?.currency;
    return getCurrencySymbol(currencies, shortName);
}
