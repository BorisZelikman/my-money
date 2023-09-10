import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import Stack from "@mui/material/Stack";
import { useCurrencies } from "../hooks/useCurrencies";
import { useActives } from "../hooks/useActives";
import { useOperations } from "../hooks/useOperations";
import { useNavigate } from "react-router-dom";

export const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const {
    currencies,
    getCurrencies,
    addCurrency,
    addCurrencyIfNotExists,
    updateCurrencyField,
    deleteCurrency,
  } = useCurrencies();
  const { actives, getActives, addActive, deleteActive, updateActiveField } =
    useActives();
  const {
    operations,
    getOperations,
    addOperation,
    deleteOperation,
    updateOperationField,
  } = useOperations();

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
      //      addActive(user.uid, "Bank", 1000, "RUB");
      getActives(user.uid);
      deleteActive(user.uid, "Fzo0SlvYD7g8Dq1jQIwV");
      updateActiveField(user.uid, "JVrCG3KkAfF27uD0j1XS", "title", "Pillow");
      updateActiveField(user.uid, "JVrCG3KkAfF27uD0j1XS", "amount", 1000000);

      getOperations(user.uid, "JVrCG3KkAfF27uD0j1XS");
      deleteOperation(user.uid, "JVrCG3KkAfF27uD0j1XS", "sDAO9LHDAe4iqEakU60S");
      updateOperationField(
        user.uid,
        "JVrCG3KkAfF27uD0j1XS",
        "ZYQR1iDQbCikoYiwo9wh",
        "amount",
        123
      );

      // addOperation(
      //   user.uid,
      //   "JVrCG3KkAfF27uD0j1XS",
      //   "payment",
      //   "Water",
      //   1,
      //   "Home",
      //   "",
      //   new Date()
      // );
    }
  }, [user]);

  useEffect(() => {
    if (actives.length > 0) navigate(`/operations/${user.uid}`);
  }, [actives]);

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
        <h4>Currencies</h4>
        {currencies.map((currency) => (
          <div key={currency.title}>
            {currency.title} ({currency.short})
          </div>
        ))}
      </div>
      <div>
        <h4>Actives</h4>
        {actives.map((a) => (
          <div key={a.id}>
            {a.id} - {a.title} ({a.amount} {a.currency})
          </div>
        ))}
      </div>
      <div>
        <h4>Operations</h4>
        {operations.map((o) => (
          <div key={o.id}>
            {o.id} - {o.title} ({o.amount})
          </div>
        ))}
      </div>
    </Box>
  );
};
