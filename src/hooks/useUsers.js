import {useState} from "react";
import {db} from "../config/firebase";
import {collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where} from "firebase/firestore";

export const useUsers = () => {
    const [users, setUsers] = useState([]);

    const usersCollectionRef = collection(db, "users");

    const getUsers = async () => {
        try {
            const data = await getDocs(usersCollectionRef);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setUsers(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const addUser = async (userId, userName) => {
        try {
            await setDoc(doc(usersCollectionRef, userId), {name: userName});
            getUsers();
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteUser = async (id) => {
        try {
            const userDoc = doc(db, "users", id);
            await deleteDoc(userDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateUserField = async (id, field, value) => {
        try {
            const userDoc = doc(db, "users", id);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(userDoc, updateData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const addUserIfNotExists = async (userName) => {
        const existingDocsQuery = query(
            usersCollectionRef,
            where("name", "==", userName)
        );

        try {
            const existingDocsSnapshot = await getDocs(existingDocsQuery);

            if (existingDocsSnapshot.size > 0) {
                return;
            }
            addUser(userName);
        }
        catch (err) {
            console.error(err);
        }
    };

    return {
        users,
        getUsers,
        addUser,
        addUserIfNotExists,
        deleteUser,
        updateUserField
    };
};
