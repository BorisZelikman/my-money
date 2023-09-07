import {assetData} from "./assetData";

const saveAssetData = () => {
    localStorage.setItem("activeData", JSON.stringify(assetData));
};

const loadAssetData = () => {
    const data = localStorage.getItem("activeData");
    return data ? JSON.parse(data) : [];
};

const addAsset = (name, currencyId, amount) => {
    if (name && currencyId && amount > 0) {
        const newActive = {
            id: assetData.length + 1,
            name: name,
            currencyId: currencyId,
            amount: amount,
            isIncludeInBalance: true
        };

        assetData.push(newActive);
        saveAssetData();
        return newActive;
    }
    return null;
};

export {addAsset, loadAssetData};
