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

const DATA = [
    {
        id: "0e2f0db1-5457-46b0-949e-8032d2f9997a",
        name: "Walmart",
        items: [
            { id: "26fd50b3-3841-496e-8b32-73636f6f4197", name: "3% Milk" },
            { id: "b0ee9d50-d0a6-46f8-96e3-7f3f0f9a2525", name: "Butter" },
        ],
        tint: 1,
    },
    {
        id: "487f68b4-1746-438c-920e-d67b7df46247",
        name: "Indigo",
        items: [
            {
                id: "95ee6a5d-f927-4579-8c15-2b4eb86210ae",
                name: "Designing Data Intensive Applications",
            },
            { id: "5bee94eb-6bde-4411-b438-1c37fa6af364", name: "Atomic Habits" },
        ],
        tint: 2,
    },
    {
        id: "25daffdc-aae0-4d73-bd31-43f73101e7c0",
        name: "Lowes",
        items: [
            { id: "960cbbcf-89a0-4d79-aa8e-56abbc15eacc", name: "Workbench" },
            { id: "d3edf796-6449-4931-a777-ff66965a025b", name: "Hammer" },
        ],
        tint: 3,
    },
];

export const Balance = () => {

    const [stores, setStores] = useState(DATA);

    const {assets, getAssets} = useAssets();
    const isSmallHeightScreen = useMediaQuery("(max-height: 500px)");
    const isLargeWidthScreen = useMediaQuery("(min-width: 801px)");
    const navigate = useNavigate();
    const [exchangeRates, setExchangeRates] = useState(null);

    useEffect(() => {
        if (AuthStore.currentUserID === null) {
            navigate(`/`);
        }
        else {
            getAssets(AuthStore.currentUserID);
            getRatesForCurrency("ILS")
        }
    }, []);


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
            console.table(rates)
        }
        catch (error) {
            console.error(error.message);
        }
    };
    function StoreList({ name, items, id }) {
        return (
            <Droppable droppableId={id}>
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                        <div className="store-container">
                            <h3>{name}</h3>
                        </div>
                        <div className="items-container">
                            {items.map((item, index) => (
                                <Draggable draggableId={item.id} index={index} key={item.id}>
                                    {(provided) => (
                                        <div
                                            className="item-container"
                                            {...provided.dragHandleProps}
                                            {...provided.draggableProps}
                                            ref={provided.innerRef}
                                        >
                                            <h4>{item.name}</h4>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
        );
    }

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
                    onDragEnd={()=>{
                        console.log("DragDropContext drag-drop event")
                    }}
                >

                    <Droppable droppableId="ROOT" type="group">
                        {(provided) => (
                            <Box {...provided.droppableProps} ref={provided.innerRef}
                                 sx = {{
                                     display: "flex",
                                     flexDirection: "column",
                                     overflowY: "auto",
                                     width: "100%",
                                     py: 1,
                                     gap: 0.5,
                                 }}>
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
                          to = "add_asset">ADD NEW ASSET</Link>
                </Button>
                <Box sx = {{
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Typography align = "center" variant = "h5">
                        TOTAL: {calcTotalForCurrency()} {getCurrencySymbol(AuthStore.currencies, "ILS")}
                    </Typography>

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
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
};
