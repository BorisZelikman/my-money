import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import { currencyData } from "../../data/currencyData";
import { getExchangeRates } from "../../data/exchangeMethods";

export const CurrencySelector = ({currencies, selectedCurrency, handleCurrencyChange}) => {
  return (
    <TextField
      select
      label="Currency"
      fullWidth
      value={selectedCurrency}
      onChange={handleCurrencyChange}
    >
      {currencies.map((currency) => (
        <MenuItem key={currency.short} value={currency.short}>
          {currency.title} ({currency.symbol})
        </MenuItem>
      ))}
    </TextField>
  );
};
