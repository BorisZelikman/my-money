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

export const useUsers = () => {
  const [users, setUsers] = useState([]);

  const usersCollectionRef = collection(db, "users");

  const getUsers = async () => {
    try {
      const data = await getDocs(usersCollectionRef);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setUsers(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  const addUser = async (newName) => {
    try {
      await addDoc(usersCollectionRef, {name: newTitle});
      getUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const userDoc = doc(db, "users", id);
      await deleteDoc(userDoc);
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserField = async (id, field, value) => {
    try {
      const userDoc = doc(db, "users", id);
      const updateData = {};
      updateData[field] = value;

      await updateDoc(userDoc, updateData);
    } catch (err) {
      console.error(err);
    }
  };

  const addUserIfNotExists = async (newName) => {
    const existingDocsQuery = query(
      usersCollectionRef,
      where("name", "==", newName)
    );

    try {
      const existingDocsSnapshot = await getDocs(existingDocsQuery);

      if (existingDocsSnapshot.size > 0) return;
      addUser(newName);
    } catch (err) {
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
