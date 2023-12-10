import {useEffect, useState} from "react";
import {Await, Link, useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";
import {CurrencySelector} from "./CurrencySelector";
import {getExchangeRates} from "../../data/exchangeMethods";
import { DragDropContext, Droppable, Draggable  } from 'react-beautiful-dnd';
import {useUserPreference} from "../../hooks/useUserPreference";
import {useAccounts} from "../../hooks/useAccounts";
import {Account} from "./Account";
import {AssetsTotal} from "./AssetsTotal";
import {TextFieldEditDialog} from "../Dialogs/TextFieldEditDialog";
import {useOperations} from "../../hooks/useOperations";
import {Backdrop, CircularProgress} from "@mui/material";
import ReorderIcon from '@mui/icons-material/Reorder';
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import {Asset} from "./Asset/Asset";
export const AssetOrder = ({onReorderAssets}) => {
    const {accounts, addAccount, getAccounts, setAccounts, deleteAccount} = useAccounts();
    const {assets, getAssets,  setAssets, addAccountAsset, updateAccountAssetField, deleteAccountAsset} = useAssets();
    const {operations, getAllAssetsOperations, operationsOfAccountAsset} = useOperations();
    const {userPreference, getUserPreference, updateUserPreference, changeUserAccountProperty} = useUserPreference();

    const [exchangeRates, setExchangeRates] = useState(null);

    const [waitScreen, setWaitScreen]=useState(false)
    const [newAccountTitleDialog, setNewAccountTitleDialog]=useState(false)
    const [dialogAccountInitValue, setDialogAccountInitValue]=useState("")

    const navigate = useNavigate();

    const userId=AuthStore.currentUserID;

    useEffect(() => {
        if (userId === null) {
            navigate(`/`);
        }
        else {
            getUserPreference(userId)
        }
    }, []);

    useEffect(()=>{
        if (userPreference===undefined || userPreference?.length===0) return
        console.table(accounts)

        getAccounts(userPreference.accounts);
        getAssets(userPreference.accounts, userPreference.assets);
    },[userPreference])

    useEffect(() => {
        console.table(assets)
    }, [accounts, assets]);



    const  handleDragDropAssets = async (results)=>{
        const {source, destination, type}=results;
        if (!destination) return;
        if (source.droppableId===destination.droppableId && source.index===destination.index) return;
        if (type==="group"){
            const reorderedAssets=[...assets];
            const [removedAsset]=reorderedAssets.splice(source.index,1);
            reorderedAssets.splice(destination.index,0,removedAsset);

            setAssets(reorderedAssets)
            const assetSettingsToSave=reorderedAssets.map((a)=>({ id:a.id}))
            await updateUserPreference(userId,"assets", assetSettingsToSave);
        }
    };
    const  handleAssetVisibilityChange = async (assetId, isVisible)=>{
            const changedUserAssets=[...userPreference.assets];
            const changedAsset=changedUserAssets.find((a)=>a.id===assetId);
            changedAsset.hide=!isVisible
            await updateUserPreference(userId,"assets", changedUserAssets);
    };

    return (
        <Box className="horisontalContainerForWidescreen">
            <Box className="verticalContainer alignCenter">
                <DragDropContext onDragEnd={handleDragDropAssets}>

                    <Droppable droppableId="ASSETS" type="group">
                        {(provided) => (
                            <Box className="verticalContainer" sx={{width:"95%"}} {...provided.droppableProps} ref={provided.innerRef}>
                                {assets.map((asset, index) => (
                                    <Draggable
                                        draggableId={asset.id}
                                        index={index}
                                        key={asset.id}
                                    >
                                        {(provided) => (
                                            <div
                                                {...provided.dragHandleProps}
                                                {...provided.draggableProps}
                                                ref={provided.innerRef}
                                            >
                                                <Asset asset = {asset} onVisibilityChange={handleAssetVisibilityChange}/>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>

            </Box>
            <Backdrop open={waitScreen} >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
};
