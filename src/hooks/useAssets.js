import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";

export const useAssets = () => {
    const [assets, setAssets] = useState([]);

    const getAssets = async (userId) => {
        const data = await getDocs(collection(db, "users", userId, "assets"));
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }));
        // Sort filteredData by the 'index' field
       // filteredData.sort((a, b) => a.index - b.index);

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

    const updateChangedAssetsIndexes = async (userId, reorderedAssets) => {
        try {
        }
        catch (err) {
            console.error("updateChangedAssetsIndexes:", reorderedAssets);
        }
    };
    const updateAssetsInFirestore = async (userId, assetsArray) => {
        const collectionRef = collection(db, 'users', userId, 'assets');

        // Iterate over the array and update each document in Firestore
        for (const asset of assetsArray) {
            const { id, ...rest } = asset;
            const assetDocRef = doc(collectionRef, id);

            // Update the document with the new data
            await updateDoc(assetDocRef, rest);
        }
      //  await getAssets(userId);

    };
    return {
        assets,
        setAssets,
        getChangedAssets,
        getAssets,
        addAsset,
        deleteAsset,
        updateAssetField
    };
};
