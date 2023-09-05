import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import Stack from "@mui/material/Stack";
import { currencyManager } from "../firestore-lib/currencyManager";
import { activeManager } from "../firestore-lib/activeManager";

export const UserProfile = () => {
  const [user, setUser] = useState(null);
  const {
    currencies,
    getCurrencies,
    addCurrency,
    addCurrencyIfNotExists,
    updateCurrencyField,
    deleteCurrency,
  } = currencyManager();
  const { actives, getActives, addActive, deleteActive, updateActiveField } =
    activeManager();
  // //---------------------
  // const [currencies, setCurrencies] = useState([]);
  // const [userData, setUserData] = useState(null);

  // const currenciesCollectionRef = collection(db, "currencies");
  // const getCurrencies = async () => {
  //   try {
  //     const data = await getDocs(currenciesCollectionRef);
  //     const filteredData = data.docs.map((doc) => ({
  //       ...doc.data(),
  //       id: doc.id,
  //     }));
  //     setCurrencies(filteredData);
  //     console.log(filteredData);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const getActives = async () => {
  //   const qSnap = await getDocs(collection(db, "users", user.uid, "Actives"));
  //   qSnap.forEach((doc) => {
  //     console.log(doc.id, "---->", doc.data());
  //   });
  // };

  // const usersCollectionRef = collection(db, "users");
  // const getUsers = async () => {
  //   try {
  //     const data = await getDocs(usersCollectionRef);
  //     const filteredData = data.docs
  //       .map((doc) => ({
  //         ...doc.data(),
  //         id: doc.id,
  //       }))
  //       .filter((u) => u.id === user.uid);
  //     setUserData(filteredData);
  //     console.log(filteredData);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  //-------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      addCurrencyIfNotExists("Euro", "EUR", "");
      updateCurrencyField("BsdvLc4EmWLRSN1NbhL0", "title", "Bitcoin");
      getCurrencies();
      //      getUsers();
      getActives(user.uid);
      addActive(user.uid, "Bank", 1000, "RUB");
      deleteActive(user.uid, "Fzo0SlvYD7g8Dq1jQIwV");
      updateActiveField(user.uid, "JVrCG3KkAfF27uD0j1XS ", "title", "Pillow");
      updateActiveField(user.uid, "JVrCG3KkAfF27uD0j1XS ", "amount", "1000000");
    }
  }, [user]);

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {user ? (
        <Stack spacing={3}>
          <Typography variant="h4">Welcome, {user.email}</Typography>
          <Typography variant="h6">User ID: {user.uid}</Typography>
          <Button onClick={logOut}>
            <Link style={{ textDecoration: "none" }} to="/">
              Sign out
            </Link>
          </Button>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Typography variant="h4">
            Please sign in to view your profile
          </Typography>
          <Button>
            <Link style={{ textDecoration: "none" }} to="/">
              Back to sign in page
            </Link>
          </Button>
        </Stack>
      )}
      <div>
        {currencies.map((currency) => (
          <div>
            {currency.title} ({currency.short})
          </div>
        ))}
      </div>
      <div>
        {actives.map((a) => (
          <div>
            {a.id} - {a.title} ({a.amount})
          </div>
        ))}
      </div>
      <div>
        {/* {userData?.map((u) => (
          <div>{u.name}</div>
        ))} */}
      </div>
    </Box>
  );
};
