import {useEffect, useState} from "react";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import AuthStore from "../../Stores/AuthStore";
import {useCurrencies} from "../../hooks/useCurrencies";
import Stack from "@mui/material/Stack";

export function History() {
    const [user, setUser]= useState(null)
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
        if (user && currentAssetId!=="") {
            getAssets(AuthStore.currentUserID);
            if (currentAssetId==="All Assets") getAllOperations(AuthStore.currentUserID, assets);
            else getOperations(AuthStore.currentUserID, currentAssetId);
        }
    }, [user, currentAssetId]);



    const handleAssetChange = (event) => {
        if (event.target.value) setCurrentAssetId(event.target.value);
        else setCurrentAssetId("All Assets");
    };

    return (
        <Stack spacing = {1.2}
               sx = {{
                   display: "flex",
                   flexDirection: "column",
                   alignItems: "center",
                   justifyContent: "center",
                   marginTop: "16px",
                   width:"90%"
               }}
        >
            <AssetSelect caption="Select asset" assets = {assets} currentAssetId = {currentAssetId}
                         handleAssetChange = {handleAssetChange} showAllAssets={true}/>
            <OperationsTable assets = {assets} operations = {operations} currencies={currencies}/>
        </Stack>
    );
}
