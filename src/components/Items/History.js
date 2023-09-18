import {useEffect, useState} from "react";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import AuthStore from "../../Stores/AuthStore";
import {useCurrencies} from "../../hooks/useCurrencies";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export function History() {
    const [user, setUser] = useState(null);
    const [currentAssetId, setCurrentAssetId] = useState("");
    const {currencies, getCurrencies} = useCurrencies();
    const {assets, getAssets} = useAssets();
    const {operations, getOperations, getAllOperations} = useOperations();

    useEffect(() => {
        if (AuthStore.currentUser) {
            setUser(AuthStore.currentUser);
            getCurrencies();
            getAssets(AuthStore.currentUserID);
        } else {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        if (user && currentAssetId !== "") {
            getAssets(AuthStore.currentUserID);
            if (currentAssetId === "All Assets") {
                getAllOperations(AuthStore.currentUserID, assets);
            } else {
                getOperations(AuthStore.currentUserID, currentAssetId);
            }
        }
    }, [user, currentAssetId]);

    const handleAssetChange = (event) => {
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
                    HISTORY
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
