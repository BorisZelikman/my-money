import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

export const CurrencySelector = ({currencies, selectedCurrency, handleCurrencyChange, isCompact}) => {
    return (
        <TextField
            sx = {isCompact? {width:"auto"}:{backgroundColor: "white"}}
            select
            label ={isCompact? null: "Currency"}
            variant={isCompact?"standard":"outlined"}
            fullWidth
            value = {selectedCurrency}
            onChange = {handleCurrencyChange}
        >
            {currencies.map((currency) => (
                <MenuItem key = {currency.short} value = {currency.short}>
                    {isCompact?currency.symbol:currency.title (currency.symbol)}
                    {/*{currency.title} ({currency.symbol})*/}

                </MenuItem>
            ))}
        </TextField>
    );
};
