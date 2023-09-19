import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useUserPreference} from "../hooks/useUserPreference";
import {Balance} from "../components/Items/Balance";
import {observer} from "mobx-react";
import AuthStore from "../Stores/AuthStore";

export const UserProfile = observer(() => {
    const {userPreference, getUserPreference} = useUserPreference();
    const navigate = useNavigate();
    useEffect(() => {
        if (AuthStore.currentUserID === null) {
            navigate(`/`);
        }
        else {
            getUserPreference(AuthStore.currentUserID);
        }
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
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                py: 2,
                backgroundColor: "rgb(243, 156, 18)"
            }}>
                <Typography variant = "h5">
                    Welcome, {userPreference.name}
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                overflowY: "auto",
                mt: 1
            }}>
                <Balance/>
            </Box>
        </Box>
    );
});
