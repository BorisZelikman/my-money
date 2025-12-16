import {useState} from "react";
import {db, isFirebaseConfigured} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";

export const useAssets = () => {
    const [assets, setAssets] = useState([]);

    const getAssets = async (userId) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot get assets');
            return;
        }
        try {
            const data = await getDocs(collection(db, "users", userId, "assets"));
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setAssets(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const addAsset = async (userId, newTitle, newAmount, newCurrency, newComment) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot add asset');
            return;
        }
        try {
            await addDoc(collection(db, "users", userId, "assets"), {
                title: newTitle,
                amount: newAmount,
                currency: newCurrency,
                comment: newComment
            });
            getAssets(userId);
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteAsset = async (userId, id) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot delete asset');
            return;
        }
        try {
            const assetDoc = doc(collection(db, "users", userId, "assets"), id);
            await deleteDoc(assetDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateAssetField = async (userId, id, field, value) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot update asset');
            return;
        }
        try {
            const assetDoc = doc(collection(db, "users", userId, "assets"), id);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(assetDoc, updateData);
            getAssets(userId);
        }
        catch (err) {
            console.error("updateAssetField:", id, field, value, err);
        }
    };

    return {
        assets,
        getAssets,
        addAsset,
        deleteAsset,
        updateAssetField
    };
};
