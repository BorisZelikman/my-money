import {useEffect} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
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
                <Typography sx = {{textTransform: "uppercase"}}
                            variant = "h4">
                    WELCOME, {userPreference.name}
                </Typography>
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
    );
});
