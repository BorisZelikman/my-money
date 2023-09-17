import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";
import {useAssets} from "./useAssets";

export const useOperations = () => {
    const [operations, setOperations] = useState([]);

    const {assets, getAssets, updateAssetField} = useAssets();

    const getOperations = async (userId, assetId) => {
        const data = await getDocs(
            collection(db, "users", userId, "assets", assetId, "operations")
        );
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            assetId: assetId
        }));
        setOperations(filteredData);
    };

    const getAllOperations = async (userId, assets) => {
        let result=[];
        for (const asset of assets) {
            const data = await getDocs(
                collection(db, "users", userId, "assets", asset.id, "operations")
            );
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
                assetId: asset.id
            }));
            result = result.concat(filteredData);
        }
        setOperations(result);
    }

    const addOperation = async (
        userId,
        assetId,
        newType,
        newTitle,
        newAmount,
        newCategory,
        newComment,
        newDatetime
    ) => {
        try {
            await addDoc(
                collection(db, "users", userId, "assets", assetId, "operations"),
                {
                    type: newType,
                    title: newTitle,
                    amount: newAmount,
                    category: newCategory,
                    comment: newComment,
                    datetime: newDatetime
                }
            );
            getOperations(userId, assetId);
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteOperation = async (userId, assetId, id) => {
        try {
            const assetDoc = doc(
                collection(db, "users", userId, "assets", assetId, "operations"),
                id
            );
            await deleteDoc(assetDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateOperationField = async (userId, assetId, id, field, value) => {
        try {
            const assetDoc = doc(
                collection(db, "users", userId, "assets", assetId, "operations"),
                id
            );
            const updateData = {};
            updateData[field] = value;

            await updateDoc(assetDoc, updateData);
        }
        catch (err) {
            console.error("updateOperationField:", id, field, value, err);
        }
    };

    return {
        operations,
        getOperations,
        getAllOperations,
        addOperation,
        deleteOperation,
        updateOperationField
    };
};
