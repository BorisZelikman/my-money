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

export const Balance = () => {
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
    }, [accounts, assets, exchangeRates]);

    const setRates=async()=>{
        const mainCur=userPreference.mainCurrency?userPreference.mainCurrency:"USD"
        AuthStore.setUserMainCurrency(mainCur)
        const rates = await getExchangeRates(mainCur).then();
        setExchangeRates(rates);
    }
    useEffect(() => {
        setRates()
    }, [userPreference.mainCurrency]);
    const handleAccountChanged = (id, property, value) => {
        console.log(id,property,value);

        // const userAccount=userPreference.accounts.find(obj=>(obj.id)===id);
        // console.log(userAccount);
        // userAccount[property]=value;
        // updateUserPreference(userId,"accounts",userPreference.accounts);
        changeUserAccountProperty(userId, id, property, value)
    };


    const  handleDragDrop = async (results)=>{
        const {source, destination, type}=results;
        if (!destination) return;
        if (source.droppableId===destination.droppableId && source.index===destination.index) return;
        if (type==="group"){
            const reorderedAccounts=[...accounts];
            const [removedAsset]=reorderedAccounts.splice(source.index,1);
            reorderedAccounts.splice(destination.index,0,removedAsset);

            setAccounts(reorderedAccounts)
            const accountSettingsToSave=reorderedAccounts.map((a)=>({ id:a.id}))
            await updateUserPreference(userId,"accounts", accountSettingsToSave);
        }
    };
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

    const handleAddAccount=async (confirmed, title) => {
        if (confirmed===true) {
            let userAccounts=[...userPreference.accounts]
            userAccounts.push({"id": await addAccount(title, userId)})
            await updateUserPreference(userId,"accounts", userAccounts);
        }
        setNewAccountTitleDialog(false)
        await setDialogAccountInitValue("")
    }
    const handleAddAsset=async (accountId, assetData) => {
        await setWaitScreen(true)
        await addAccountAsset(accountId,assetData.title, Number(assetData.amount), assetData.currencyId, assetData.comment);
        await getAssets(userPreference.accounts, userPreference.assets);
        await setWaitScreen(false)
    }
    const handleEditAsset=async (assetData) => {
        await setWaitScreen(true)
        //await addAccountAsset(accountId,assetData.title, Number(assetData.amount), assetData.currencyId, assetData.comment);
        const accId=assets.find((a)=>a.id===assetData.id).accountId;
        await updateAccountAssetField(accId, assetData.id,"title",assetData.title)
        await updateAccountAssetField(accId, assetData.id,"amount",Number (assetData.amount))
        await updateAccountAssetField(accId, assetData.id,"currency",assetData.currencyId)
        await updateAccountAssetField(accId, assetData.id,"comment",assetData.comment)
        await getAssets(userPreference.accounts, userPreference.assets);
        await setWaitScreen(false)
    }
    const handleDeleteAsset=async (assetData) => {
        await setWaitScreen(true)
        const accId=assets.find((a)=>a.id===assetData.id).accountId;
        const operations=await operationsOfAccountAsset(accId,assetData.id);

        if (operations.length===0){
          await deleteAccountAsset(accId, assetData.id)
        }
        else {
            alert(`There are ${operations.length} operations in this asset`);
        }

        await getAssets(userPreference.accounts, userPreference.assets);
        await setWaitScreen(false)
    }
    const handleDeleteAccount = async (id) => {
        setWaitScreen(true)
        const assetsOfAccount=assets.filter(a=>a.accountId===id);
        const operationsOfAccount = await getAllAssetsOperations(assetsOfAccount);
        setWaitScreen(false)
        if (operationsOfAccount.length>0) {
            alert(`There are ${operationsOfAccount.length} operations in this account`);
        }
        else{
            deleteAccount(id);
            let userAccounts=[...userPreference.accounts];
            await updateUserPreference(userId,"accounts", userAccounts.filter(a=>a.id!==id));
        }
    };

    console.log("dialogAccountInitValue=", dialogAccountInitValue)
    return (
        <Box className="horisontalContainerForWidescreen">
            <TextFieldEditDialog
                open={newAccountTitleDialog}
                dialogTitleText="Add new account" textFieldTitle="Title" initialValue={dialogAccountInitValue}
                onClose={handleAddAccount}/>
            <Box className="verticalContainer alignCenter">
                <DragDropContext onDragEnd={handleDragDrop}>
                    <Droppable droppableId="ROOT" type="group">
                        {(provided) => (
                            <Box className="verticalContainer" {...provided.droppableProps} ref={provided.innerRef}>
                                {accounts.map((account, index) => (
                                    <Draggable draggableId={account.id} index={index} key={account.id}>
                                        {(provided) => (
                                            <div
                                                {...provided.dragHandleProps}
                                                {...provided.draggableProps}
                                                ref={provided.innerRef}
                                            >
                                                <Account
                                                    account={account}
                                                    assets={assets.filter(a=>a.accountId===account.id)}
                                                    exchangeRates={exchangeRates}
                                                    handleDragDropAssets={handleDragDropAssets}
                                                    onEditAccount={handleAccountChanged}
                                                    onDeleteAccount={handleDeleteAccount}
                                                    onAddAsset={handleAddAsset}
                                                    onEditAsset={handleEditAsset}
                                                    onDeleteAsset={handleDeleteAsset}
                                                    onAssetVisibilityChange={handleAssetVisibilityChange}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>

                <Box className="toolbarContainer">
                    <Button variant = "contained" sx = {{minWidth: "170px"}}
                            onClick={()=>setNewAccountTitleDialog(true)}>
                        ADD NEW ACCOUNT
                    </Button>
                    <div className="right-component horisontalContainer" >
                        <AssetsTotal  assets={assets} exchangeRates={exchangeRates}
                                      userAccounts={userPreference.accounts} hideSymbol='true'/>
                        <CurrencySelector
                            currencies = {AuthStore.currencies}
                            selectedCurrency = {AuthStore.userMainCurrency}
                            isCompact="true"
                            handleCurrencyChange = {async (e) => {
                                await updateUserPreference(userId, "mainCurrency", e.target.value);
                                getUserPreference(userId);
                            }}
                        />
                    </div>
                </Box>
            </Box>
            <Backdrop open={waitScreen} >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
};
