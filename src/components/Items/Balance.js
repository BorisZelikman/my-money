import {useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";
import useMediaQuery from "@mui/material/useMediaQuery";
import {getCurrencySymbol} from "../../data/currencyMethods";
import authStore from "../../Stores/AuthStore";
import {CurrencySelector} from "./CurrencySelector";
import {Grid} from "@mui/material";
import {getExchangeRates} from "../../data/exchangeMethods";
import { DragDropContext, Droppable, Draggable  } from 'react-beautiful-dnd';
import {useUserPreference} from "../../hooks/useUserPreference";

export const Balance = () => {
    const {assets, getAssets,  setAssets} = useAssets();
    const {userPreference, getUserPreference, updateUserPreference} = useUserPreference();


    const isSmallHeightScreen = useMediaQuery("(max-height: 370px)");
    const isLargeWidthScreen = useMediaQuery("(min-width: 801px)");
    const navigate = useNavigate();
    const [exchangeRates, setExchangeRates] = useState(null);


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
        const userAccounts=userPreference.accounts;
        const assetsSettings= userPreference.assets ? userPreference.assets : [];

        getAssets(userAccounts, assetsSettings);
        getRatesForCurrency("ILS")
    },[userPreference])

    const totals = assets.reduce((acc, asset) => {
        const {currency, amount} = asset;

        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
    }, {});

    const calcTotalForCurrency=()=>{
        let sum=0;
        for (const total of Object.entries(totals)) {
            const rate=1/exchangeRates[total[0]]
            sum+=total[1]*rate;
        }
        return sum.toFixed(0);
    }
    const getRatesForCurrency = async (currencyId) => {
        try {
            const rates = await getExchangeRates(currencyId);
            setExchangeRates(rates);
        }
        catch (error) {
            console.error(error.message);
        }
    };

    const  handleDragDrop = async (results)=>{
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
        <Box sx = {{
            display: "flex",
            flexDirection: isLargeWidthScreen ? "row" : "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                maxHeight: "100%",
                width:"100%"
            }}>


                <DragDropContext
                    onDragEnd={handleDragDrop}
                >

                    <Droppable droppableId="ROOT" type="group">
                        {(provided) => (
                            <Box className="assetBox" {...provided.droppableProps} ref={provided.innerRef}>
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
                                                <Asset asset = {asset}/>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>
                <Button variant = "contained" sx = {{width: "200px", m: 1}}>
                    <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}}
                          to = "/add_asset">ADD NEW ASSET</Link>
                </Button>
                <Box sx = {{
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Typography align = "center" variant = "h5">
                        TOTAL: {calcTotalForCurrency()} {getCurrencySymbol(AuthStore.currencies, "ILS")}
                    </Typography>
                    {!isSmallHeightScreen && (

                    <Grid container direction="column" item sx={{my:"10px", }}>
                        {Object.entries(totals).map(([currency, total]) => (
                            <Grid container direction="row" >
                                <Grid item xs direction="row" sx={{
                                  display: "flex",
                                  justifyContent: "flex-start",
                                  alignItems:"center",
                                }}

                                >
                                    <Typography variant = "caption">
                                        {total.toFixed(2)}
                                    </Typography>
                                    <Typography variant = "caption" sx = {{ml:0.2,mr:2, fontWeight: 500}}>
                                        {getCurrencySymbol(AuthStore.currencies, currency)}
                                    </Typography>
                                </Grid>
                                <Grid item xs direction="row" variant = "overline"
                                      sx={{
                                          display: "flex",
                                          justifyContent: "flex-end",
                                          alignItems:"center"

                                      }}
                                >
                            <Typography variant = "caption" sx={{opacity:0.4}}>
                                {(total/exchangeRates[currency]).toFixed(2)}
                            </Typography>
                            <Typography variant = "caption" sx = {{ml:0.2, mr: 1, fontWeight: 500,opacity:0.4}}>
                                {getCurrencySymbol(AuthStore.currencies, "ILS")}
                            </Typography>
                            <Typography variant = "caption" sx={{opacity:0.4}}>
                                 ({(1/exchangeRates[currency]).toFixed(5)})
                            </Typography>

                        </Grid>
                        </Grid>
                        ))}
                    </Grid>)}
                </Box>
            </Box>
        </Box>
    );
};
