import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import AuthStore from "../../Stores/AuthStore";
import {useCurrencies} from "../../hooks/useCurrencies";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import authStore from "../../Stores/AuthStore";

export function History() {
    const [currentAssetId, setCurrentAssetId] = useState("");
//    const {currencies, getCurrencies} = useCurrencies();
    const {assets, getAssets} = useAssets();
    const {operations, getAccountAssetOperations, getAllOperations} = useOperations();

    const navigate = useNavigate();

    const userId = AuthStore.currentUserID;
    const currencies= AuthStore.currencies;
    const userAccounts= AuthStore.userAccounts;
    const assetsSettings= AuthStore.userAssets;

    const assetById =(id)=> assets.find((a) => a.id === id);

    useEffect(() => {
        if (userId === null) {
            navigate(`/`);
        }
        else {
            getAssets(userAccounts, assetsSettings);
            console.log("getAssets")
        }
    }, []);

    useEffect(() => {
        if (assets.length === 0) return;
//        console.table (assets)

    }, [assets]);



    useEffect(() => {
        if (currentAssetId !== "") {
//            getAssets(AuthStore.currentUserID);
            if (currentAssetId === "All Assets") {
                getAllOperations(userId, assets);
            } else {
                //getOperations(userId, currentAssetId);
                getAccountAssetOperations(assetById(currentAssetId)?.accountId, currentAssetId);
            }
        }
    }, [currentAssetId]);

    const handleAssetChange = (event) => {
        console.log("handleAssetChange event.target.value", event.target.value);
        if (event.target.value) {
            setCurrentAssetId(event.target.value);
        } else {
            setCurrentAssetId("All Assets");
        }
    };

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
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
                    History
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-evenly",
                width: "100%",
                maxHeight: "80%"
            }}>
                <Box sx = {{
                    alignItems: "center",
                    justifyContent: "center",
                    width: "90%",
                    pt: 5
                }}>
                    <AssetSelect caption = "Select asset" assets = {assets} currentAssetId = {currentAssetId}
                                 handleAssetChange = {handleAssetChange} showAllAssets = {true}/>
                </Box>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "90%",
                    overflowY: "auto",
                    pb: 1
                }}>
                    < OperationsTable assets = {assets} operations = {operations} currencies = {currencies}/>
                </Box>
            </Box>
        </Box>
    );
}
