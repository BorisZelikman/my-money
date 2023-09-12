import React, {useEffect, useState} from "react";
import {signOut} from "firebase/auth";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Link, useNavigate} from "react-router-dom";
import Stack from "@mui/material/Stack";
import {useCurrencies} from "../hooks/useCurrencies";
import {useActives} from "../hooks/useActives";
import {useOperations} from "../hooks/useOperations";
import {Logo} from "../components/Logo/Logo";
import Balance from "../components/Items/Balance";

export const UserProfile = () => {
    const [user, setUser] = useState(null);
    const {
        currencies,
        getCurrencies,
        addCurrency,
        addCurrencyIfNotExists,
        updateCurrencyField,
        deleteCurrency
    } = useCurrencies();
    const {actives, getActives, addActive, deleteActive, updateActiveField} =
        useActives();
    const {
        operations,
        getOperations,
        addOperation,
        deleteOperation,
        updateOperationField
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
        }
    }, [user]);

    useEffect(() => {
        if (actives.length > 0) {
//            navigate(`/operations/${user.uid}`);
        }
    }, [actives]);

    const logOut = async () => {
        try {
            await signOut(auth);
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx = {{display: "flex", flexDirection: "column", alignItems: "center"}}>
            {user ? (
                <Stack spacing = {3}>
                    <Typography variant = "h4">Welcome, {user.email}</Typography>
                    <Typography variant = "h6">User ID: {user.uid}</Typography>

                </Stack>
            ) : (
                <Stack spacing = {3}>
                    <Typography variant = "h4">Please sign in to view your profile</Typography>
                    <Button>
                        <Link style = {{textDecoration: "none"}} to = "/">Back to sign in page</Link>
                    </Button>
                </Stack>
            )}
        </Box>
    );
};
