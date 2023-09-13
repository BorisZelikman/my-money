import {useState} from "react";
import {db} from "../config/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";

export const useOperations = () => {
    const [operations, setOperations] = useState([]);

    const getOperations = async (userId, activeId) => {
        const data = await getDocs(
            collection(db, "users", userId, "actives", activeId, "operations")
        );
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }));
        setOperations(filteredData);
    };

    const addOperation = async (
        userId,
        activeId,
        newType,
        newTitle,
        newAmount,
        newCategory,
        newComment,
        newDatetime
    ) => {
        try {
            await addDoc(
                collection(db, "users", userId, "actives", activeId, "operations"),
                {
                    type: newType,
                    title: newTitle,
                    amount: newAmount,
                    category: newCategory,
                    comment: newComment,
                    datetime: newDatetime
                }
            );
            getOperations(userId, activeId);
        }
        catch (err) {
            console.error(err);
        }
    };

    const deleteOperation = async (userId, activeId, id) => {
        try {
            const activeDoc = doc(
                collection(db, "users", userId, "actives", activeId, "operations"),
                id
            );
            await deleteDoc(activeDoc);
        }
        catch (err) {
            console.error(err);
        }
    };

    const updateOperationField = async (userId, activeId, id, field, value) => {
        try {
            const activeDoc = doc(
                collection(db, "users", userId, "actives", activeId, "operations"),
                id
            );
            const updateData = {};
            updateData[field] = value;

            await updateDoc(activeDoc, updateData);
        }
        catch (err) {
            console.error("updateOperationField:", id, field, value, err);
        }
    };

    return {
        operations,
        getOperations,
        addOperation,
        deleteOperation,
        updateOperationField
    };
};
