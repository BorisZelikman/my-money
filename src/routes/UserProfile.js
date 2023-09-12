import React, {useEffect, useState} from "react";
import {signOut} from "firebase/auth";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Link, useNavigate} from "react-router-dom";
import Stack from "@mui/material/Stack";

export const UserProfile = () => {
    const [user, setUser] = useState(null);

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
