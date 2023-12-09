import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc, setDoc} from "firebase/firestore";
import {useUserPreference} from "./useUserPreference";

export const useAssets = () => {
    const [assets, setAssets] = useState([]);

    const getAssets = async (userAccounts, userAssetsSettings) => {
//        console.log ("getAssets: ", userAccounts, userAssetsSettings );

        // collecting assets from all accounts of user
        let allAssets=[];
        for (const userAccount of userAccounts) {
            if (userAccount.switched){
                let accountAssets=await getAccountAssets(userAccount.id);
                allAssets.push(...accountAssets)
            }
        }

        // creating asset settings array, if user have no assets settings yet
        if (userAssetsSettings?.length===0){
            userAssetsSettings=allAssets.map((obj,index)=>({id:obj.id, index}))
        }

        const havetoAddElements = allAssets.filter(item1 => !userAssetsSettings.some(item2 => item2.id === item1.id));
        userAssetsSettings.push(...havetoAddElements.map((obj,index)=>({id:obj.id, index})))

        // merging data from accounts assets with userPreference assets settings
        const assetsWithPrefs=allAssets.map(a=>{
            const prefsItem=userAssetsSettings.find(s=>s.id===a.id)
            const prefsItemIndex=userAssetsSettings.findIndex(s=>s.id===a.id)
            return{id:a.id, accountId: a.accountId, title: a.title, amount:a.amount, currency: a.currency, comment : a.comment,
                   index:prefsItemIndex, isHide:prefsItem.hide}
        })
        assetsWithPrefs.sort((a, b) => a.index - b.index);
        // console.table (allAssets);
        // console.table (userAssetsSettings);
        // console.table (assetsWithPrefs);

        // const personalAssets = await getUserAssets(userId);
        // const familyAssets = []//await getFamilyAssets(userPreference.familyId);
//        const allAssets=[...personalAssets,...familyAssets].sort((a, b) => a.index - b.index);
        //console.table(allAssets);

        await setAssets(assetsWithPrefs);
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

    const getAccountAssets = async (userAccountId) => {
        const data = await getDocs(collection(db, "accounts", userAccountId, "assets"));
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            accountId: userAccountId
        }));

//        setAssets(filteredData);

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

    const deleteAccountAsset = async (accountId, id) => {
        try {
            const assetDoc = doc(collection(db, "accounts", accountId, "assets"), id);
            await deleteDoc(assetDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateAccountAssetField = async (accountId, id, field, value) => {
        try {
            const assetDoc = doc(collection(db, "accounts", accountId, "assets"), id);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(assetDoc, updateData);
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
                await updateAccountAssetField(userId, assets[i].id, "index", i);
            }
        }
    };

    return {
        assets,
        setAssets,
        // storeReorderedAssets,
        // storeChangedAssetsIndexes,
        getAssets,
        //addAsset,
        deleteAsset,

        getAccountAssets,
        addAccountAsset,
        updateAccountAssetField,
        deleteAccountAsset
    };
};
