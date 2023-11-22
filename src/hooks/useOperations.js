import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";
import {useAssets} from "./useAssets";



export const useOperations = () => {

    const [operations, setOperations] = useState([]);
    const [operation, setOperation] = useState();

    const getOperations = async (userId, assetId) => {
        const data = await getDocs(
            collection(db, "users", userId, "assets", assetId, "operations")
        );
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            assetId: assetId
        }));
        await setOperations(filteredData);

        return filteredData
    };


    const OperationsOfAccountAsset= async (accountId, assetId) => {


        const data = await getDocs(
            collection(db, "accounts", accountId, "assets", assetId, "operations")
        );
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            assetId: assetId
        }));
        return(filteredData);
    };
    const getAccountAssetOperations = async (accountId, assetId) => {
        const assetOperations=await OperationsOfAccountAsset(accountId, assetId)
//        console.table(assetOperations);
        await setOperations(assetOperations);
    };
    const getAccountAssetOperation = async (accountId, assetId, operationId ) => {
        const assetOperations=await OperationsOfAccountAsset(accountId, assetId)
        await setOperation(assetOperations.find((a) => a.id === operationId));
        return operation;
    };

    const getAllAssetsOperations = async (assets) => {
        let allOperations=[];
        for (const asset of assets) {
            const assetOperation=await OperationsOfAccountAsset(asset.accountId, asset.id)
            allOperations.push(assetOperation)
        }
        await setOperations(allOperations);
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
            await getOperations (userId, assetId);
        }
        catch (err) {
            console.error(err);
        }
    };
    const addAccountAssetOperation = async (
        accountId,
        assetId,
        newType,
        newTitle,
        newAmount,
        newCategory,
        newComment,
        newDatetime,
        userId
    ) => {
        try{
            const result= await addDoc(
                collection(db, "accounts", accountId, "assets", assetId, "operations"),
                {
                    type: newType,
                    title: newTitle,
                    amount: newAmount,
                    category: newCategory,
                    comment: newComment,
                    datetime: newDatetime,
                    userId: userId
                }
            );
            getAccountAssetOperations(accountId, assetId);
            return result.id;
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

    const updateOperationField = async (accountId, assetId, id, field, value) => {
        try {
            const assetDoc = doc(
                collection(db, "accounts", accountId, "assets", assetId, "operations"),
                id
            );
            const updateData = {};
            updateData[field] = value;

            await updateDoc(assetDoc, updateData);
        }
        catch (err) {
            console.error("updateOperationField:", accountId, assetId, id, field, value, err);
        }
    };

    return {
        operations,
        operation,
        getOperations,
        getAllOperations,
        addOperation,
        deleteOperation,
        updateOperationField,

        getAccountAssetOperations,
        getAccountAssetOperation,

        addAccountAssetOperation
    };
};
