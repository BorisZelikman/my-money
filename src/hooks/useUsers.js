import {useState} from "react";
import {db, isFirebaseConfigured} from "../config/firebase";
import {collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where} from "firebase/firestore";

export const useUsers = () => {
    const [users, setUsers] = useState([]);

    const getUsers = async () => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot get users');
            return;
        }
        try {
            const usersCollectionRef = collection(db, "users");
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
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot add user');
            return;
        }
        try {
            const usersCollectionRef = collection(db, "users");
            await setDoc(doc(usersCollectionRef, userId), {name: userName});
            getUsers();
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteUser = async (id) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot delete user');
            return;
        }
        try {
            const userDoc = doc(db, "users", id);
            await deleteDoc(userDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateUserField = async (id, field, value) => {
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot update user');
            return;
        }
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
        if (!isFirebaseConfigured || !db) {
            console.warn('Firebase not configured - cannot check user');
            return;
        }
        const usersCollectionRef = collection(db, "users");
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
