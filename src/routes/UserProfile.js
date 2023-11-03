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
            //console.log("getUserPreference(", AuthStore.currentUserID,")")
            getUserPreference(AuthStore.currentUserID);
            getCurrencies()
        }
    }, []);

    useEffect(() => {
        if (currencies?.length>0) {
            AuthStore.setCurrencies(currencies)
        }
    }, [currencies]);

    useEffect(() => {
//            console.log("AuthStore.currencies set:", AuthStore.currencies)
    }, [AuthStore.currencies]);

    useEffect(() => {
    }, [userPreference]);



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
                <Balance/>
            </Box>
        </Box>
    );
});
