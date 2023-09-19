import { useState, useEffect } from "react";
import {useNavigate} from "react-router-dom";
import AuthStore from "../../Stores/AuthStore";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import {currencyData} from "../../data/currencyData";
import {useCurrencies} from "../../hooks/useCurrencies";
import {getCryptoExchangeRate, getExchangeRates} from "../../data/exchangeMethods";
import PublicIcon from "@mui/icons-material/Public";
import useMediaQuery from "@mui/material/useMediaQuery";
import "/node_modules/flag-icons/css/flag-icons.min.css";

export const CurrencyConverter = () => {
    const [selectedCurrency, setSelectedCurrency] = useState("ILS");
    const [selectedAmount, setSelectedAmount] = useState(1);
    const [exchangeRates, setExchangeRates] = useState(null);
    const [currencyList, setCurrencyList] = useState(currencyData);
    const [crypto, setCrypto] = useState(0);
    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");

    const navigate = useNavigate();
    if (AuthStore.currentUserID === null) {
      navigate(`/`);
    }
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
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                py: 2,
                backgroundColor: "rgb(243, 156, 18)"
            }}>
                <Typography align = "center" variant = "h5">
                    Currency converter
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "90%",
                gap: 1,
                mt: isSmallHeightScreen ? 1 : 5
            }}>
                <TextField
                    sx = {{backgroundColor: "white"}}
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
                    sx = {{backgroundColor: "white"}}
                    type = "number"
                    label = "Amount"
                    fullWidth
                    defaultValue = "1"
                    onChange = {handleAmountChange}
                />
            </Box>
            <Button variant = "contained"
                    sx = {{width: "200px", my: 3}}
                    onClick = {handleConvert}>Convert</Button>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "90%",
                maxHeight: "90%",
                overflowY: "auto"
            }}>
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
            </Box>
        </Box>
    );
};
