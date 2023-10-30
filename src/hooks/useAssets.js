import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc, setDoc} from "firebase/firestore";
import {useUserPreference} from "./useUserPreference";

export const useAssets = () => {
//    const {userPreference, getUserPreference,addUserPreference} = useUserPreference();

    const [assets, setAssets] = useState([]);




    const getAssets = async (userAccounts) => {
        console.log (userAccounts);
        let allAssets=[];
        for (const accountId of userAccounts) {
            let accountAssets=await getAccountAssets(accountId);
console.log(accountAssets)
            allAssets.push(...accountAssets)
        }
        console.table (allAssets);

        // const personalAssets = await getUserAssets(userId);
        // const familyAssets = []//await getFamilyAssets(userPreference.familyId);
//        const allAssets=[...personalAssets,...familyAssets].sort((a, b) => a.index - b.index);
        //console.table(allAssets);

        setAssets(allAssets);
    };

    const getUserAssets = async (userId) => {
        const data = await getDocs(collection(db, "users", userId, "assets"));
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }));
        // Sort filteredData by the 'index' field
        //filteredData.sort((a, b) => a.index - b.index);

        return filteredData;
    };

    const getAccountAssets = async (accountId) => {
        const data = await getDocs(collection(db, "accounts", accountId, "assets"));
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }));

        setAssets(filteredData);

        return (filteredData);
    };

    const addAsset = async (userId, newTitle, newAmount, newCurrency, newComment) => {
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

    const addAccountAsset = async (accountId, newTitle, newAmount, newCurrency, newComment) => {
        try {
            const result= await addDoc(collection(db, "accounts", accountId, "assets"), {
                title: newTitle,
                amount: newAmount,
                currency: newCurrency,
                comment: newComment
            });
//            await getAccountAssets(accountId);
            return result.id
        }
        catch (err) {
            console.error(err);
        }
    };
    const addAccount = async ( createdByUserId) => {
        try {
            const result= await addDoc(collection(db, "accounts"), {
                createdByUserId: createdByUserId,
            });

        }
        catch (err) {
            console.error(err);
        }
    };
    const deleteAsset = async (userId, id) => {
        try {
            const assetDoc = doc(collection(db, "users", userId, "assets"), id);
            await deleteDoc(assetDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateAssetField = async (userId, id, field, value) => {
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

    const getChangedAssets = (originalAssets, reorderedAssets) => {
        return reorderedAssets.filter((reorderedAsset, index) => {
            const originalAsset = originalAssets[index];
            return reorderedAsset.index !== originalAsset.index;
        });
    }

    const storeReorderedAssets = async (userId, reorderedAssets) => {
        try {
            await setDoc(doc(collection(db, "users", userId, "assets")), reorderedAssets);
            await getAssets(userId);
        }
        catch (err) {
            console.error("storeReorderedAssets:", reorderedAssets);
        }
    };
    const storeChangedAssetsIndexes = async (userId, assets) => {

        // Iterate over the array and update each document in Firestore
        for (const i in assets) {
            console.log(i, assets[i])
            if (assets[i].index!==i){
                console.log(assets[i].id,  "updateAssetField index=",i)
                await updateAssetField(userId, assets[i].id, "index", i);
            }
        }
    };

    return {
        assets,
        setAssets,
        storeReorderedAssets,
        storeChangedAssetsIndexes,
        getAssets,
        addAsset,
        deleteAsset,
        updateAssetField,

        getAccountAssets,
        addAccountAsset
    };
};
