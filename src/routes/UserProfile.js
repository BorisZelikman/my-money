import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useUserPreference} from "../hooks/useUserPreference";
import {Balance} from "../components/Items/Balance";
import {observer} from "mobx-react";
import AuthStore from "../Stores/AuthStore";
import {useCurrencies} from "../hooks/useCurrencies";

export const UserProfile = observer(() => {
    const {userPreference, getUserPreference} = useUserPreference();
    const {currencies, getCurrencies} = useCurrencies();

    const navigate = useNavigate();
    useEffect(() => {
        if (AuthStore.currentUserID === null) {
            navigate(`/`);
        }
        else {
            getUserPreference(AuthStore.currentUserID);
            console.log("UserProfile loading:", AuthStore.currencies)
            if (AuthStore.currencies===null) getCurrencies()
        }
    }, []);

    useEffect(() => {
        if (currencies.length>0) {
            AuthStore.setCurrencies(currencies)
            console.log("currencies loaded:", currencies)
        }
    }, [currencies]);

    useEffect(() => {
//            console.log("AuthStore.currencies loaded:", currencies)
    }, [AuthStore.currencies]);

    return (
        <Box className="page">
            <Box className="title-box">
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
                <Balance />
            </Box>
        </Box>
    );
});
