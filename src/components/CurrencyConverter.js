import React from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import currencyData from "../data/currencyData";

export const CurrencyConverter = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack spacing={3} width="300px">
        <Typography align="center" variant="h6">
          CURRENCY CONVERTER
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <TextField
            select
            label="Currency"
            fullWidth
            defaultValue="USD"
          >
            {currencyData.map((currency) => (
              <MenuItem key={currency.code} value={currency.code}>
                <img
                  src={currency.flag}
                  alt={`${currency.code} Flag`}
                  style={{ width: '20px', marginRight: '8px' }}
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
          />
        </Stack>
        <Button>Convert</Button>
        <Divider />
        {currencyData.map((currency) => (
          <Stack direction="row" alignItems="center" spacing={2} key={currency.code} >
            <img
              src={currency.flag}
              alt={`${currency.code} Flag`}
              style={{ width: '20px', marginRight: '8px' }}
            />
            <Typography>{currency.code}</Typography>
            <Typography>Rate: X.XX</Typography>
            <Typography>Amount: X.XX</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default CurrencyConverter;
