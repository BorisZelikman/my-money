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
import {getCryptoExchangeRate, getExchangeRate, getExchangeRates} from "../../data/exchangeMethods";

export const Balance = () => {
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
                width: "100%"
            }}>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    width: "100%",
                    py: 1,
                    gap: 0.5
                }}>
                    {assets.map((asset) => (
                        <Asset key = {asset.id} asset = {asset}/>
                    ))}
                </Box>
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
