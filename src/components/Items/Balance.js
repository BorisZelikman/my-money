import {useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
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

export const Balance = () => {
    const {accounts, getAccounts, setAccounts} = useAccounts();
    const {assets, getAssets,  setAssets} = useAssets();
    const {userPreference, getUserPreference, updateUserPreference, changeUserAccountProperty} = useUserPreference();

    const [exchangeRates, setExchangeRates] = useState(null);

    const navigate = useNavigate();

    const userId=AuthStore.currentUserID;
    const userAccounts = Array.from(AuthStore.userAccounts).map(proxy => proxy.id)

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
    return (
        <Box className="horisontalContainerForWidescreen">
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
                                                    onAccountChange={handleAccountChanged}
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
                    <Button variant = "contained" sx = {{minWidth: "170px"}}>
                        <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}}
                              to = "/add_asset">ADD NEW ACCOUNT</Link>
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
        </Box>
    );
};
