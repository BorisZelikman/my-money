
export function getOperationsWithAssetsFields(assets, operations) {
    if (assets.length===0 || operations.length===0) return;
    const assetToCurrencyMap = new Map(assets.map(asset => [asset.id, asset.currency]));
    const assetToTitleMap = new Map(assets.map(asset => [asset.id, asset.title]));
    const operationsWithAssetsFields = operations.map(operation => ({
        ...operation,
        currency: assetToCurrencyMap.get(operation.assetId),
        assetTitle: assetToTitleMap.get(operation.assetId),
    }));
    return operationsWithAssetsFields.sort((a, b) => a.datetime.seconds - b.datetime.seconds).reverse();
}

export function getOperationsInInterval(operations, startDate, finishDate) {
     return operations.filter((o) => {
        const date = new Date(o.datetime.seconds * 1000);

        const fromDate = new Date(startDate);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(finishDate);
        toDate.setHours(23, 59, 59, 999);
        return fromDate <= date && date <= toDate;
    });
}
export function getOperationsSum(operations) {
     return operations.reduce((acc, opp) => acc + parseFloat(opp.amount),0).toFixed(0);
}

export function getCategoriesOfOperations(operations) {
    const uniqueTitlesSet = new Set(operations.map(obj => obj.category));
    return Array.from(uniqueTitlesSet);
}
