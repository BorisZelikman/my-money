import {useEffect, useState} from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import {useParams} from "react-router-dom";
import AuthStore from "../../Stores/AuthStore";

export function History() {
    const [currentAssetId, setCurrentAssetId] = useState("");
    const {assets, getAssets} = useAssets();
    const {operations, getOperations} = useOperations();

    useEffect(() => {
        if (AuthStore.currentUser) {
            setUser(AuthStore.currentUser);
        } else {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        if (userId && currentAssetId) {
            getOperations(userId, currentAssetId);
        }
    }, [currentAssetId]);

    useEffect(() => {
        if (assets && assets.length > 0) {
            setCurrentAssetId(assets[0].id);
        }
    }, [assets]);

    const handleAssetChange = (event) => {
        setCurrentAssetId(event.target.value);
    };

    return (
        <>
            <AssetSelect currentAssetId = {currentAssetId} handleAssetChange = {handleAssetChange}
                         assets = {assets}/>
             <OperationsTable className ="fullOperations" operations={operations}/>
        </>
    );
}
