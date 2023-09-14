import {useEffect, useState} from "react";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import AuthStore from "../../Stores/AuthStore";

export function History() {
    const [user, setUser]= useState(null)
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
        if (user) {
            getAssets(AuthStore.currentUserID);
            if (currentAssetId) {
                getOperations(AuthStore.currentUserID, currentAssetId);
            }
        }
    }, [user, currentAssetId]);

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
