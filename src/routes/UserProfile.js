import {useEffect} from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {useUserPreference} from "../hooks/useUserPreference";
import {Balance} from "../components/Items/Balance";
import {observer} from "mobx-react";
import AuthStore from "../Stores/AuthStore";

export const UserProfile = observer(() => {
    const {userPreference, getUserPreference} = useUserPreference();
    useEffect(() => {
        getUserPreference(AuthStore.currentUserID);
    }, []);

    return (
        <Stack spacing = {4}>
            <Typography variant = "h4">Welcome, {userPreference?.name}</Typography>
            <Balance/>
        </Stack>
    );
});
