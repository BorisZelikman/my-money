import apiConfig from "../config/currency-converter-api-key.json"
import AuthStore from "../Stores/AuthStore";

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


export function calcTotalForCurrency(assets,exchangeRates, userAccounts){
    const totals = assets?.reduce((acc, asset) => {
        let {currency, amount, accountId} = asset;
         const userAccount=userAccounts?.find(obj=>obj.id===accountId);
         const allowToAdd= (userAccount && "switched" in userAccount)?userAccount.switched:true;
        amount*=allowToAdd?1:0;

        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
    }, {});

    if (assets.length===0) return ""

    let sum=0;
    for (const total of Object.entries(totals)) {
        const rate=exchangeRates?1/exchangeRates[total[0]]:1
        sum+=total[1]*rate;
    }
    return sum.toFixed(0);
}

export function calcTotalForOperations(operations,exchangeRates){
    const totals = operations?.reduce((acc, operation) => {
        let {currency, amount} = operation;
        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
    }, {});

    if (operations.length===0) return ""

    let sum=0;
    for (const total of Object.entries(totals)) {
        const rate=exchangeRates?1/exchangeRates[total[0]]:1
        sum+=total[1]*rate;
    }
    return sum.toFixed(0);
}
export function getCurrencySymbol(currencies, shortName) {
    const symbol = currencies?.find(c=>c.short===shortName)?.symbol;
    return symbol?symbol:"";
}
export function getCurrencyOfAsset(assets, assetId) {
    const shortName = assets?.find(a=>a.id===assetId)?.currency;
    return shortName?shortName:"";
}
export function getCurrencySymbolOfAsset(assets, assetId, currencies) {
    const shortName = assets?.find(a=>a.id===assetId)?.currency;
    return getCurrencySymbol(currencies, shortName)
}
