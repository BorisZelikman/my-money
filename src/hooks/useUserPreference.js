import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where} from "firebase/firestore";

export const useUserPreference = () => {
    const [userPreference, setUserPreference] = useState([]);

    const usersCollectionRef = collection(db, "users");

    const getUserPreference = async (userId) => {
        try {
            const data = await getDocs(usersCollectionRef);
            const filteredData = data.docs.map((doc) => ({
                                         ...doc.data(),
                                         id: doc.id
                                     }))
                                     .filter((u) => u.id === userId)[0];
            await setUserPreference(filteredData);
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
            await getUserPreference(userId);
        }
        catch (err) {
            console.error(err);
        }
    };

    const changeUserAccountProperty = async (userId, userAccountId, property, value) => {
        const userAccount=userPreference.accounts.find(obj=>(obj.id)===userAccountId);
        userAccount[property]=value;
        await updateUserPreference(userId,"accounts",userPreference.accounts);
    };

    return {
        userPreference,
        getUserPreference,
        addUserPreference,
        deleteUserPreference,
        updateUserPreference,

        changeUserAccountProperty
    };
};
