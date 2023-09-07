import {activeData} from "./activeData";

const saveActiveData = () => {
    localStorage.setItem("activeData", JSON.stringify(activeData));
};

const loadActiveData = () => {
    const data = localStorage.getItem("activeData");
    return data ? JSON.parse(data) : [];
};

const addActive = (name, currencyId, amount) => {
    if (name && currencyId && amount > 0) {
        const newActive = {
            id: activeData.length + 1,
            name: name,
            currencyId: currencyId,
            amount: amount,
            isIncludeInBalance: true
        };

        activeData.push(newActive);
        saveActiveData();
        return newActive;
    }
    return null;
};

export {addActive, loadActiveData};
