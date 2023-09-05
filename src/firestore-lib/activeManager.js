import { useState } from "react";
import { db } from "../config/firebase";
import {
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  collection,
  query,
  where,
} from "firebase/firestore";

export const activeManager = () => {
  const [actives, setActives] = useState([]);

  //  const activeCollectionRef = collection(db, "currencies");

  const getActives = async (userId) => {
    const data = await getDocs(collection(db, "users", userId, "Actives"));
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setActives(filteredData);

    data.forEach((doc) => {
      console.log(doc.id, "---->", doc.data());
    });
  };

  /*
  const getCurrencies = async () => {
    try {
      const data = await getDocs(currenciesCollectionRef);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCurrencies(filteredData);
      console.log(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  const checkCurrencyExists = async (title, short, imgUrl) => {
    try {
      const data = await getDocs(currenciesCollectionRef);
      const filteredData = data.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
        .some(
          (c) => c.title === title && c.short === short && c.imgUrl === imgUrl
        );
      return filteredData;
    } catch (err) {
      console.error(err);
    }
  };

  const addCurrency = async (newTitle, newShort, newImgUrl) => {
    try {
      await addDoc(currenciesCollectionRef, {
        title: newTitle,
        short: newShort,
        imgUrl: newImgUrl,
      });
      getCurrencies();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCurrency = async (id) => {
    try {
      const currencyDoc = doc(db, "currencies", id);
      await deleteDoc(currencyDoc);
    } catch (err) {
      console.error(err);
    }
  };

  const updateCurrencyField = async (id, field, value) => {
    try {
      const currencyDoc = doc(db, "currencies", id);
      const updateData = {};
      updateData[field] = value;

      await updateDoc(currencyDoc, updateData);
    } catch (err) {
      console.error(err);
    }
  };

  const addCurrencyIfNotExists = async (newTitle, newShort, newImgUrl) => {
    const existingDocsQuery = query(
      currenciesCollectionRef,
      where("title", "==", newTitle),
      where("short", "==", newShort),
      where("imgUrl", "==", newImgUrl)
    );

    try {
      const existingDocsSnapshot = await getDocs(existingDocsQuery);

      if (existingDocsSnapshot.size > 0) return;
      addCurrency(newTitle, newShort, newImgUrl);
    } catch (err) {
      console.error(err);
    }
  };

*/
  return {
    actives,
    getActives,
    // addCurrency,
    // addCurrencyIfNotExists,
    // deleteCurrency,
    // updateCurrencyField,
  };
};
