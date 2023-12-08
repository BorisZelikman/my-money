import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import {useEffect} from "react";

export const CurrencySelector = ({currencies, selectedCurrency, handleCurrencyChange, isCompact}) => {
    console.log(currencies, selectedCurrency)
    useEffect(() => {

    }, [currencies, selectedCurrency]);
    return (
        <TextField
            sx = {isCompact? {width:"auto"}:{p:0}}
            select
            label ={isCompact? null: "Currency"}
            variant={isCompact?"standard":"outlined"}
            fullWidth
            value = {selectedCurrency}
            onChange = {handleCurrencyChange}
        >
            {currencies.map((currency) => (
                <MenuItem key = {currency.short} value = {currency.short}>
                    {isCompact?currency.symbol:`${currency.symbol} (${currency.title})`}
                    {/*{currency.symbol}*/}
                </MenuItem>
            ))}
        </TextField>
    );
};
