import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

export const CurrencySelector = ({currencies, selectedCurrency, handleCurrencyChange}) => {
    return (
        <TextField
            sx = {{backgroundColor: "white"}}
            select
            label = "Currency"
            fullWidth
            value = {selectedCurrency}
            onChange = {handleCurrencyChange}
        >
            {currencies.map((currency) => (
                <MenuItem key = {currency.short} value = {currency.short}>
                    {currency.title} ({currency.symbol})
                </MenuItem>
            ))}
        </TextField>
    );
};
