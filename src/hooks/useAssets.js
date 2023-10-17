import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc, setDoc} from "firebase/firestore";

export const useAssets = () => {
    const [assets, setAssets] = useState([]);

    const getAssets = async (userId) => {
        const data = await getDocs(collection(db, "users", userId, "assets"));
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }));
        // Sort filteredData by the 'index' field
        filteredData.sort((a, b) => a.index - b.index);

        setAssets(filteredData);
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
        updateAssetField
    };
};
