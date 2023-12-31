import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where} from "firebase/firestore";

export const useUserPreference = () => {
    const [userPreference, setPreference] = useState([]);

    const usersCollectionRef = collection(db, "users");

    const getUserPreference = async (userId) => {
        try {
            const data = await getDocs(usersCollectionRef);
            const filteredData = data.docs
                                     .map((doc) => ({
                                         ...doc.data(),
                                         id: doc.id
                                     }))
                                     .filter((u) => u.id === userId)[0];
            setPreference(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const addUserPreference = async (newTitle, newShort, newImgUrl) => {
        try {
            await addDoc(usersCollectionRef, {
                title: newTitle,
                short: newShort,
                imgUrl: newImgUrl
            });
            getUserPreference();
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteUserPreference = async (id) => {
        try {
            const usersDoc = doc(db, "users", id);
            await deleteDoc(usersDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateUserPreference = async (userId, field, value) => {
        try {
            const usersDoc = doc(db, "users", userId);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(usersDoc, updateData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const addCurrencyIfNotExists = async (newTitle, newShort, newImgUrl) => {
        const existingDocsQuery = query(
            usersCollectionRef,
            where("title", "==", newTitle),
            where("short", "==", newShort),
            where("imgUrl", "==", newImgUrl)
        );

        try {
            const existingDocsSnapshot = await getDocs(existingDocsQuery);

            if (existingDocsSnapshot.size > 0) {
                return;
            }
            addUserPreference(newTitle, newShort, newImgUrl);
        }
        catch (err) {
            console.error(err);
        }
    };

    return {
        userPreference,
        getUserPreference,
        addUserPreference,
        deleteUserPreference,
        updateUserPreference: updateUserPreference,
    };
};
