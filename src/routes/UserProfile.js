import {useEffect} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useUserPreference} from "../hooks/useUserPreference";
import {Balance} from "../components/Items/Balance";
import {observer} from "mobx-react";
import AuthStore from "../Stores/AuthStore";
import useMediaQuery from "@mui/material/useMediaQuery";

export const UserProfile = observer(() => {
    const {userPreference, getUserPreference} = useUserPreference();
    const isScreenSmall = useMediaQuery("(max-height: 400px)");

    useEffect(() => {
        getUserPreference(AuthStore.currentUserID);
    }, []);

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%",
                py: 3
            }}>
                <Typography variant = "h4">Welcome, {userPreference.name}</Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%",
                overflowY: "auto"
            }}>
                <Balance/>
            </Box>
        </Box>
    )
        ;
});
