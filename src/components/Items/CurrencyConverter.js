import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import {currencyData} from "../../data/currencyData";
import {useCurrencies} from "../../hooks/useCurrencies";
import {getCryptoExchangeRate, getExchangeRates} from "../../data/exchangeMethods";
import PublicIcon from "@mui/icons-material/Public";

export const CurrencyConverter = () => {
    const [selectedCurrency, setSelectedCurrency] = useState("ILS");
    const [selectedAmount, setSelectedAmount] = useState(1);
    const [exchangeRates, setExchangeRates] = useState(null);
    const [currencyList, setCurrencyList] = useState(currencyData);
    const [crypto, setCrypto] = useState(0);

    const {currencies, getCurrencies} = useCurrencies();
    useEffect(() => {
        getCurrencies();
    }, []);

    const handleCurrencyChange = (event) => {
        setSelectedCurrency(event.target.value);
        handleConvert();
    };

    const handleAmountChange = (event) => {
        setSelectedAmount(event.target.value);
        handleConvert();
    };

    const handleConvert = async () => {
        try {
            const rates = await getExchangeRates(selectedCurrency);
            setExchangeRates(rates);
            const rate = await getCryptoExchangeRate(selectedCurrency, `BTC`);
            setCrypto(rate.toFixed(8));
        }
        catch (error) {
            console.error(error.message);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {3} width = "300px">
                <Typography align = "center" variant = "h6">
                    CURRENCY CONVERTER
                </Typography>
                <Stack direction = "row" alignItems = "center" spacing = {2}>
                    <TextField
                        select
                        label = "Currency"
                        fullWidth
                        value = {selectedCurrency}
                        onChange = {handleCurrencyChange}
                    >
                        {currencyList.map((currency) => (
                            <MenuItem key = {currency.code} value = {currency.code}>
                                <img
                                    src = {currency.flag}
                                    alt = {`${currency.code} Flag`}
                                    style = {{width: "20px", marginRight: "8px"}}
                                />
                                {currency.code}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        type = "number"
                        label = "Amount"
                        fullWidth
                        defaultValue = "1"
                        onChange = {handleAmountChange}
                    />
                </Stack>
                <Button onClick = {handleConvert}>Convert</Button>
                <Divider/>
                {exchangeRates && (
                    <Stack
                        direction = "row"
                        alignItems = "center"
                        spacing = {2}
                        key = "header"
                        sx = {{width: "100%"}}
                    >
                        <Stack alignItems = "center" style = {{width: "10%"}}/>
                        <Stack alignItems = "center" style = {{width: "10%"}}>
                            <Typography>Code</Typography>
                        </Stack>
                        <Stack alignItems = "center" style = {{width: "40%"}}>
                            <Typography>Rate</Typography>
                        </Stack>
                        <Stack alignItems = "center" style = {{width: "40%"}}>
                            <Typography>Amount</Typography>
                        </Stack>
                    </Stack>
                )}
                {exchangeRates &&
                    currencies.map((currency) => (
                        <Stack
                            direction = "row"
                            alignItems = "center"
                            spacing = {2}
                            key = {currency.short}
                            sx = {{width: "100%"}}
                        >
                            <Stack alignItems = "center" style = {{width: "10%"}}>
                                {currency.short === "BTC" ? (
                                    <PublicIcon/>
                                ) : (
                                    <span
                                        className = {`fi fi-${currency.short.slice(0, 2).toLowerCase()}`}
                                        style = {{width: "20px", marginRight: "8px"}}
                                    />
                                )}
                            </Stack>
                            <Stack alignItems = "center" style = {{width: "10%"}}>
                                <Typography>{currency.short}</Typography>
                            </Stack>
                            <Stack alignItems = "center" style = {{width: "40%"}}>
                                <Typography>
                                    {isNaN(exchangeRates[currency.short])
                                        ? crypto
                                        : exchangeRates[currency.short].toFixed(2)}
                                </Typography>
                            </Stack>
                            <Stack alignItems = "center" style = {{width: "40%"}}>
                                <Typography>
                                    {isNaN(exchangeRates[currency.short])
                                        ? crypto * selectedAmount
                                        : (exchangeRates[currency.short] * selectedAmount).toFixed(2)}
                                </Typography>
                            </Stack>
                        </Stack>
                    ))}
            </Stack>
        </Box>
    );
};
