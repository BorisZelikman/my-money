import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";

export const useAssets = () => {
    const [actives, setActives] = useState([]);

    const getAssets = async (userId) => {
        const data = await getDocs(collection(db, "users", userId, "actives"));
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }));
        setActives(filteredData);
    };

    const addAsset = async (userId, newTitle, newAmount, newCurrency) => {
        try {
            await addDoc(collection(db, "users", userId, "actives"), {
                title: newTitle,
                amount: newAmount,
                currency: newCurrency
            });
            getAssets(userId);
        }
        catch (err) {
            console.error(err);
        }
    };
    const deleteAsset = async (userId, id) => {
        try {
            const activeDoc = doc(collection(db, "users", userId, "actives"), id);
            await deleteDoc(activeDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateAssetField = async (userId, id, field, value) => {
        try {
            const activeDoc = doc(collection(db, "users", userId, "actives"), id);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(activeDoc, updateData);
            getAssets(userId);
        }
        catch (err) {
            console.error("updateActiveField:", id, field, value, err);
        }
    };

    return {
        actives,
        getAssets,
        addAsset,
        deleteAsset,
        updateAssetField
    };
};
