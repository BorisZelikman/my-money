import { activeData } from "./activeData";

const saveActiveData = () => {
  localStorage.setItem("activeData", JSON.stringify(activeData));
};

const loadActiveData = () => {
  const data = localStorage.getItem("activeData");
  return data ? JSON.parse(data) : [];
};

const addActive = (name, currencyID, amount) => {
  if (name && currencyID && amount > 0) {
    const newActive = {
      ID: activeData.length + 1,
      Name: name,
      CurrencyID: currencyID,
      Amount: amount,
      IsIncludelnBalance: true,
    };

    activeData.push(newActive);
    saveActiveData();
    return newActive;
  }
  return null;
};

export { addActive, loadActiveData };
