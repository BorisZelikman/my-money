import {useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";
import {CurrencySelector} from "./CurrencySelector";
import {Grid} from "@mui/material";
import {getExchangeRates} from "../../data/exchangeMethods";
import { DragDropContext, Droppable, Draggable  } from 'react-beautiful-dnd';
import {useUserPreference} from "../../hooks/useUserPreference";
import {useAccounts} from "../../hooks/useAccounts";
import {Account} from "./Account";
import {AssetsTotal} from "./AssetsTotal";

export const Balance = () => {
    const {accounts, getAccounts, setAccounts} = useAccounts();
    const {assets, getAssets,  setAssets} = useAssets();
    const {userPreference, getUserPreference, updateUserPreference} = useUserPreference();

    const [exchangeRates, setExchangeRates] = useState(null);

    const navigate = useNavigate();

    const userId=AuthStore.currentUserID;
    const userAccounts = Array.from(AuthStore.userAccounts).map(proxy => proxy.id)
    const userAssets = Array.from(AuthStore.userAssets).map(proxy => proxy.id)

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

        getAccounts(userAccounts);
        getAssets(AuthStore.userAccounts, AuthStore.userAssets);
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
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {/*{assets.map((asset, index) => (*/}
                                {/*    <Draggable*/}
                                {/*        draggableId={asset.id}*/}
                                {/*        index={index}*/}
                                {/*        key={asset.id}*/}
                                {/*    >*/}
                                {/*        {(provided) => (*/}
                                {/*            <div*/}
                                {/*                {...provided.dragHandleProps}*/}
                                {/*                {...provided.draggableProps}*/}
                                {/*                ref={provided.innerRef}*/}
                                {/*            >*/}
                                {/*                <Asset asset = {asset}/>*/}
                                {/*            </div>*/}
                                {/*        )}*/}
                                {/*    </Draggable>*/}
                                {/*))}*/}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>

                {/*<Box sx = {{*/}
                {/*    alignItems: "center",*/}
                {/*    justifyContent: "center"*/}
                {/*}}>*/}
                {/*    <Typography align = "center" variant = "h5">*/}
                {/*        TOTAL: {calcTotalForCurrency()} {getCurrencySymbol(AuthStore.currencies, "ILS")}*/}
                {/*    </Typography>*/}
                {/*    {!isSmallHeightScreen && (*/}

                {/*    <Grid container direction="column" item sx={{my:"10px", }}>*/}
                {/*        {Object.entries(totals).map(([currency, total]) => (*/}
                {/*            <Grid container direction="row" >*/}
                {/*                <Grid item xs direction="row" sx={{*/}
                {/*                  display: "flex",*/}
                {/*                  justifyContent: "flex-start",*/}
                {/*                  alignItems:"center",*/}
                {/*                }}*/}

                {/*                >*/}
                {/*                    <Typography variant = "caption">*/}
                {/*                        {total.toFixed(2)}*/}
                {/*                    </Typography>*/}
                {/*                    <Typography variant = "caption" sx = {{ml:0.2,mr:2, fontWeight: 500}}>*/}
                {/*                        {getCurrencySymbol(AuthStore.currencies, currency)}*/}
                {/*                    </Typography>*/}
                {/*                </Grid>*/}
                {/*                <Grid item xs direction="row" variant = "overline"*/}
                {/*                      sx={{*/}
                {/*                          display: "flex",*/}
                {/*                          justifyContent: "flex-end",*/}
                {/*                          alignItems:"center"*/}

                {/*                      }}*/}
                {/*                >*/}
                {/*            <Typography variant = "caption" sx={{opacity:0.4}}>*/}
                {/*                {(total/exchangeRates[currency]).toFixed(2)}*/}
                {/*            </Typography>*/}
                {/*            <Typography variant = "caption" sx = {{ml:0.2, mr: 1, fontWeight: 500,opacity:0.4}}>*/}
                {/*                {getCurrencySymbol(AuthStore.currencies, "ILS")}*/}
                {/*            </Typography>*/}
                {/*            <Typography variant = "caption" sx={{opacity:0.4}}>*/}
                {/*                 ({(1/exchangeRates[currency]).toFixed(5)})*/}
                {/*            </Typography>*/}

                {/*        </Grid>*/}
                {/*        </Grid>*/}
                {/*        ))}*/}
                {/*    </Grid>)}*/}
                {/*</Box>*/}
                <Box className="toolbarContainer">
                    <Button variant = "contained" sx = {{minWidth: "170px"}}>
                        <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}}
                              to = "/add_asset">ADD NEW ACCOUNT</Link>
                    </Button>
                    <div className="right-component horisontalContainer" >
                        <AssetsTotal  assets={assets} exchangeRates={exchangeRates} hideSymbol='true'/>
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
