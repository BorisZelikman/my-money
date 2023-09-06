import { useState } from "react";
import { db } from "../config/firebase";
import {
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  collection,
  query,
  where,
} from "firebase/firestore";

export const useActives = () => {
  const [actives, setActives] = useState([]);

  const getActives = async (userId) => {
    const data = await getDocs(collection(db, "users", userId, "actives"));
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setActives(filteredData);
  };

  const addActive = async (userId, newTitle, newAmount, newCurrency) => {
    try {
      await addDoc(collection(db, "users", userId, "actives"), {
        title: newTitle,
        amount: newAmount,
        currency: newCurrency,
      });
      getActives(userId);
    } catch (err) {
      console.error(err);
    }
  };
  const deleteActive = async (userId, id) => {
    try {
      const activeDoc = doc(collection(db, "users", userId, "actives"), id);
      await deleteDoc(activeDoc);
    } catch (err) {
      console.error(err);
    }
  };

  // !!! The method is throwing errors !!!
  const updateActiveField = async (userId, id, field, value) => {
    try {
      const activeDoc = doc(collection(db, "users", userId, "actives"), id);
      const updateData = {};
      updateData[field] = value;

      await updateDoc(activeDoc, updateData);
      getActives(userId);
    } catch (err) {
      console.error("updateActiveField:", id, field, value, err);
    }
  };

  return {
    actives,
    getActives,
    addActive,
    deleteActive,
    updateActiveField,
  };
};
