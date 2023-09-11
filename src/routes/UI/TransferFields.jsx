import React from 'react';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

const TransferFields = ({ transferToActives, transferToActiveId, handleTransferToActiveChange, rate, handleRateChange }) => {
    return (
        <>
            <Select
                onChange={handleTransferToActiveChange}
                sx={{
                    width: 300
                }}
                value={transferToActiveId}
            >
                {transferToActives.map((a) => (
                    <MenuItem value={a.id}>
                        {a.title} ({a.amount} {a.currency})
                    </MenuItem>
                ))}
            </Select>
            <div style={{width: 300, display: "flex", alignItems: "center"}}>
                <Typography variant="p" gutterBottom style={{width: "70%"}}>
                    Transfer rate
                </Typography>
                <TextField
                    style={{width: "30%"}}
                    label="Rate"
                    type="number"
                    value={rate}
                    onChange={handleRateChange}
                />
            </div>
        </>
    );
};

export default TransferFields;
