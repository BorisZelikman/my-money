import {useState} from "react";
import {db, isFirebaseConfigured} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where} from "firebase/firestore";

export const useCurrencies = () => {
    const [currencies, setCurrencies] = useState([]);

    const getCurrencies = async () => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot get currencies');
            return;
        }
        try {
            const currenciesCollectionRef = collection(db, "currencies");
            const data = await getDocs(currenciesCollectionRef);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setCurrencies(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const checkCurrencyExists = async (title, short, imgUrl) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot check currency');
            return false;
        }
        try {
            const currenciesCollectionRef = collection(db, "currencies");
            const data = await getDocs(currenciesCollectionRef);
            const filteredData = data.docs
                                     .map((doc) => ({
                                         ...doc.data(),
                                         id: doc.id
                                     }))
                                     .some(
                                         (c) => c.title === title && c.short === short && c.imgUrl === imgUrl
                                     );
            return filteredData;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    };

    const addCurrency = async (newTitle, newShort, newImgUrl) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot add currency');
            return;
        }
        try {
            const currenciesCollectionRef = collection(db, "currencies");
            await addDoc(currenciesCollectionRef, {
                title: newTitle,
                short: newShort,
                imgUrl: newImgUrl
            });
            getCurrencies();
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteCurrency = async (id) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot delete currency');
            return;
        }
        try {
            const currencyDoc = doc(db, "currencies", id);
            await deleteDoc(currencyDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateCurrencyField = async (id, field, value) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot update currency');
            return;
        }
        try {
            const currencyDoc = doc(db, "currencies", id);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(currencyDoc, updateData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const addCurrencyIfNotExists = async (newTitle, newShort, newImgUrl) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot add currency');
            return;
        }
        const currenciesCollectionRef = collection(db, "currencies");
        const existingDocsQuery = query(
            currenciesCollectionRef,
            where("title", "==", newTitle),
            where("short", "==", newShort),
            where("imgUrl", "==", newImgUrl)
        );

        try {
            const existingDocsSnapshot = await getDocs(existingDocsQuery);

            if (existingDocsSnapshot.size > 0) {
                return;
            }
            addCurrency(newTitle, newShort, newImgUrl);
        }
        catch (err) {
            console.error(err);
        }
    };

    return {
        currencies,
        getCurrencies,
        addCurrency,
        addCurrencyIfNotExists,
        deleteCurrency,
        updateCurrencyField,
    };
};
