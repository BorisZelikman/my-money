import { useState } from "react";
import { db } from "../config/firebase";
import {
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  collection,
} from "firebase/firestore";

export const useOperations = () => {
  const [operations, setOperations] = useState([]);

  const getOperations = async (userId, activeId) => {
    const data = await getDocs(
      collection(db, "users", userId, "actives", activeId, "operations")
    );
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setOperations(filteredData);
  };

  const addOperation = async (userId, newTitle, newAmount, newCurrency) => {
    try {
      await addDoc(collection(db, "users", userId, "actives"), {
        title: newTitle,
        amount: newAmount,
        currency: newCurrency,
      });
      getOperations(userId);
    } catch (err) {
      console.error(err);
    }
  };
  const deleteOperation = async (userId, id) => {
    try {
      const activeDoc = doc(collection(db, "users", userId, "actives"), id);
      await deleteDoc(activeDoc);
    } catch (err) {
      console.error(err);
    }
  };

  // !!! The method is throwing errors !!!
  const updateOperationField = async (userId, id, field, value) => {
    try {
      const activeDoc = doc(collection(db, "users", userId, "actives"), id);
      const updateData = {};
      updateData[field] = value;

      await updateDoc(activeDoc, updateData);
    } catch (err) {
      console.error("updateOperationField:", id, field, value, err);
    }
  };

  return {
    operations,
    getOperations,
    addOperation,
    deleteOperation,
    updateOperationField,
  };
};
