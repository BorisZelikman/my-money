import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where} from "firebase/firestore";

export const useAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);

    const accountsCollectionRef = collection(db, "accounts");

    const getAccounts = async () => {
        try {
            const data = await getDocs(accountsCollectionRef);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setAccounts(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };
    const getAccountsForUser = async (userAccounts) => {
        try {
            const data = await getDocs(accountsCollectionRef);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setAccounts(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const getUsersOfAccounts = async (accountsIds) => {
        try {
            for (const accountId of accountsIds) {

            }
            const data = await getDocs(accountsCollectionRef);
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setAccounts(filteredData);
        }
        catch (err) {
            console.error(err);
        }
    };

    const checkAccountExists = async (title, short, imgUrl) => {
        try {
            const data = await getDocs(accountsCollectionRef);
            const filteredData = data.docs
                                     .map((doc) => ({
                                         ...doc.data(),
                                         id: doc.id
                                     }))
                                     .some(
                                         (c) => c.title === title && c.short === short && c.imgUrl === imgUrl
                                     );
            return filteredData;
        }
        catch (err) {
            console.error(err);
        }
    };

    const addAccount = async (createdByUserId) => {
        try {
            const result= await addDoc(accountsCollectionRef, {
                users: [createdByUserId]
            });
            getAccounts();
            return result.id
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteAccount = async (id) => {
        try {
            const accountDoc = doc(db, "accounts", id);
            await deleteDoc(accountDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateAccountField = async (id, field, value) => {
        try {
            const accountDoc = doc(db, "accounts", id);
            const updateData = {};
            updateData[field] = value;

            await updateDoc(accountDoc, updateData);
        }
        catch (err) {
            console.error(err);
        }
    };


    return {
        accounts,
        getAccounts,
        addAccount,
        deleteAccount,
        updateAccountField,

    };
};
