import {useEffect, useState} from "react";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import {useParams} from "react-router-dom";

export function History() {
    const [currentActiveId, setCurrentActiveId] = useState("");
    const {actives, getAssets} = useAssets();
    const {operations, getOperations} = useOperations();
    const {userId} = useParams();


    useEffect(() => {
        if (userId) {
            getAssets(userId);
            if (currentActiveId) {
                getOperations(userId, currentActiveId);
            }
        }
    }, [userId]);

    useEffect(() => {
        if (userId && currentActiveId) {
            getOperations(userId, currentActiveId);
        }
    }, [currentActiveId]);

    useEffect(() => {
        if (actives && actives.length > 0) {
            setCurrentActiveId(actives[0].id);
        }
    }, [actives]);

    const handleActiveChange = (event) => {
        setCurrentActiveId(event.target.value);
    };

    return (
        <>
            <AssetSelect currentActiveId = {currentActiveId} handleActiveChange = {handleActiveChange}
                         actives = {actives}/>
             <OperationsTable className ="fullOperations" operations={operations}/>
        </>
    );
}
