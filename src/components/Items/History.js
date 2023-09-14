import {useEffect, useState} from "react";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import {useParams} from "react-router-dom";

export function History() {
    const [currentAssetId, setCurrentAssetId] = useState("");
    const {assets, getAssets} = useAssets();
    const {operations, getOperations} = useOperations();
    const {userId} = useParams();


    useEffect(() => {
        if (userId) {
            getAssets(userId);
            if (currentAssetId) {
                getOperations(userId, currentAssetId);
            }
        }
    }, [userId]);

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
