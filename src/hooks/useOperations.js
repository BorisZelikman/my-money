import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc, where} from "firebase/firestore";
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


    const operationsOfAccountAsset= async (accountId, assetId) => {


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
//        if (!accountId||!assetId) return;
        const assetOperations=await operationsOfAccountAsset(accountId, assetId)
        //console.table(assetOperations);
        for (const operation of assetOperations) {
            if (operation.category==="credit") {
                await updateOperationField(accountId, assetId, operation.id,
                    "purposeId",
                    operation.title==="tami4"||operation.title==="Ёнатан"||operation.title==="адвокат"||operation.title==="арнона"||operation.title==="ваад байт"||operation.title==="вода"||operation.title==="гарантия (сервис)"||operation.title==="грузчики"||operation.title==="ремонт зеркала в лифте"||operation.title==="электричество"?
                        "iPix9r72BjOu4F9O71O5":
                    "2w7VYmIiuLMHC5GnpOzh")
            }
        }
        await setOperations(assetOperations);
    };
    const getAccountAssetOperation = async (accountId, assetId, operationId ) => {
        const assetOperations=await operationsOfAccountAsset(accountId, assetId)
        const op =assetOperations.find((a) => a.id === operationId)
        await setOperation(op);
        return op;
    };

    const getAllAssetsOperations = async (assets, needSetOperations=false) => {
        let allOperations=[];
        for (const asset of assets) {
            const assetOperation=await operationsOfAccountAsset(asset.accountId, asset.id)
            allOperations.push(...assetOperation)
        }
        if (needSetOperations) setOperations(allOperations)
        return (allOperations);
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
//            await getOperations (userId, assetId);
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
        userId,
        purposeId
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
                    userId: userId,
                    purposeId:purposeId
                }
            );
//            getAccountAssetOperations(accountId, assetId);
            return result.id;
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteOperation = async (accountId, assetId, id) => {
        try {
            const assetDoc = doc(
                collection(db, "accounts", accountId, "assets", assetId,  "operations"),
                id
            );
            await deleteDoc(assetDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteOperationsByDate = async (accountId, assetId, specifiedDate) => {
        try {
            const operationsRef = collection(
                db, "accounts", accountId, "assets", assetId, "operations"
            );

            // Create a query to get operations with date greater than specifiedDate
            const query = query(operationsRef, where("date", ">", specifiedDate));

            // Get documents based on the query
            const querySnapshot = await getDocs(query);

            // Delete each document
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });

            // Wait for all delete operations to complete
            await Promise.all(deletePromises);

            console.log('Operations deleted successfully.');
        } catch (err) {
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
        setOperations,
        getOperations,
        getAllOperations,
        addOperation,
        deleteOperation,
        updateOperationField,

        operationsOfAccountAsset,
        getAccountAssetOperations,
        getAccountAssetOperation,
        getAllAssetsOperations,

        addAccountAssetOperation
    };
};
