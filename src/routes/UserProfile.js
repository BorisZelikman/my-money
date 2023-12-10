import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useUserPreference} from "../hooks/useUserPreference";
import {Balance} from "../components/Items/Balance";
import {observer} from "mobx-react";
import AuthStore from "../Stores/AuthStore";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import WalletIcon from '@mui/icons-material/Wallet';
import {AssetOrder} from "../components/Items/AssetOrder";
import {getExchangeRates} from "../data/exchangeMethods";

export const UserProfile = observer(() => {
    const {userPreference, getUserPreference, updateUserPreference} = useUserPreference();
    const [exchangeRates, setExchangeRates] = useState(null);

    const [viewMode, setViewMode]= useState("Accounts")
    const navigate = useNavigate();
    useEffect(() => {
        if (AuthStore.currentUserID === null) {
            navigate(`/`);
        }
        else {
            //console.log("getUserPreference(", AuthStore.currentUserID,")")
            getUserPreference(AuthStore.currentUserID);
        }
    }, []);

    useEffect(() => {
        if (userPreference.length===0) return;
        setViewMode(userPreference.viewMode)
    }, [userPreference]);

    const handleReorderAssets= ()=>{
        console.log("ReorderAssets");
    }

    const handleChangeViewMode=async (mode) =>{
        await setViewMode(mode);
        await updateUserPreference (AuthStore.currentUserID,"viewMode", mode);
    }

    const handleMainCurrencyChange=async (mainCurrency) =>{

        // get rates from API only if mainCurrency was changed
        if (exchangeRates && exchangeRates[mainCurrency]===1) return;

        const rates = await getExchangeRates(mainCurrency).then();
        setExchangeRates(rates);
    }

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

                mt: 1
            }}>
            <ToggleButtonGroup   value={viewMode}>
                <ToggleButton value = "Accounts" sx={{py:1}}
                              onClick={()=>handleChangeViewMode("Accounts")}>
                    <SupervisedUserCircleIcon sx={viewMode==="Accounts"?{mr:1, color:"#1976d2"}:{mr:1}}/>
                    Accounts</ToggleButton>
                <ToggleButton value = "Assets" sx={{py:1}}
                              onClick={()=>handleChangeViewMode("Assets")}>
                    <WalletIcon sx={viewMode==="Assets"?{mr:1, color:"#1976d2"}:{mr:1}}/>
                    Assets</ToggleButton>
            </ToggleButtonGroup>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                overflowY: "auto",
                mt: 1
            }}>

                {viewMode==="Accounts"&&<Balance exchangeRates={exchangeRates}
                                                 onMainCurrencyChange={handleMainCurrencyChange} />}
                {viewMode==="Assets"&&<AssetOrder/>}
            </Box>
        </Box>
    );
});
