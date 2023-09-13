import React, {useEffect} from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useParams } from "react-router-dom";
import { useUserPreference} from "../hooks/useUserPreference";
import {Balance} from "../components/Items/Balance";

export const UserProfile = () => {
    const { userId } = useParams()
    const {userPreference, getUserPreference} = useUserPreference()
    useEffect(() => {
        getUserPreference(userId)
    }, []);

    return (
        <Stack spacing = {4}>
            <Typography variant = "h4">Welcome, {userPreference?.name}</Typography>
            <Balance/>
        </Stack>
    );
};
