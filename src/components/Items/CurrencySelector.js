import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

export const CurrencySelector = ({currencies, selectedCurrency, handleCurrencyChange, isCompact}) => {
    console.log(currencies[0].title, selectedCurrency)
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
                </MenuItem>
            ))}
        </TextField>
    );
};
