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

export const CurrencyConverter = () => {
  const [selectedCurrency, setSelectedCurrency] = useState("ILS")
  const [selectedAmount, setSelectedAmount] = useState(1)
  const [exchangeRates, setExchangeRates] = useState(null)
  const [currencyList, setCurrencyList] = useState(currencyData)

  const handleCurrencyChange = (event) => {
    setSelectedCurrency(event.target.value)
    handleConvert()
  }

  const handleAmountChange = (event) => {
    setSelectedAmount(event.target.value)
    handleConvert()
  }

  const handleConvert = async () => {
    try {
      const rates = await getExchangeRates(selectedCurrency)
      setExchangeRates(rates)
    } catch (error) {
      console.error(error.message)
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Stack spacing={3} width="300px">
        <Typography align="center" variant="h6">
          CURRENCY CONVERTER
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <TextField
            select
            label="Currency"
            fullWidth
            value={selectedCurrency}
            onChange={handleCurrencyChange}
          >
            {currencyList.map((currency) => (
              <MenuItem key={currency.code} value={currency.code}>
                <img
                  src={currency.flag}
                  alt={`${currency.code} Flag`}
                  style={{ width: "20px", marginRight: "8px" }}
                />
                {currency.code}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Amount"
            fullWidth
            defaultValue="1"
            onChange={handleAmountChange}
          />
        </Stack>
        <Button onClick={handleConvert}>Convert</Button>
        <Divider />
        {exchangeRates && (
          currencyList.map((currency) => (
            selectedCurrency != currency.code && (
              <Stack direction="row" alignItems="center" spacing={2} key={currency.code}>
                <>
                  <img
                    src={currency.flag}
                    alt={`${currency.code} Flag`}
                    style={{ width: "20px", marginRight: "8px" }}
                  />
                  <Typography>{currency.code}</Typography>
                  <Typography>Rate: {(exchangeRates[currency.code]).toFixed(2)}</Typography>
                  <Typography>Amount: {(exchangeRates[currency.code] * selectedAmount).toFixed(2)}</Typography>
                </>
              </Stack>
            )
          ))
        )}
      </Stack>
    </Box>
  );
};
