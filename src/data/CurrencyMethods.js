export function getCurrencySymbol(currencies, shortName) {
    const symbol = currencies.find(c=>c.short===shortName);
    return symbol?symbol:"";
}
