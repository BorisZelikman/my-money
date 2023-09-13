import apiKey from "../config/currency-converter-api-key.json";

export async function getExchangeRate(fromCurrency, toCurrency) {
    try {
        const API_KEY = `${apiKey.apiKey}`;

        const response = await fetch(
            `https://open.er-api.com/v6/latest/${fromCurrency}/${toCurrency}`,
            {
                headers: {
                    "apikey": API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }

        const data = await response.json();
        return data.rate;

    }
    catch (error) {
        console.error("ErrorErrorError fetching exchange rate:", error);
        throw error;
    }
}
