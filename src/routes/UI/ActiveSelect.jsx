import React from 'react';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const ActiveSelect = ({ currentActiveId, handleActiveChange, actives }) => (
    <Select
        onChange={handleActiveChange}
        sx={{
            marginTop: 2,
            width: 300
        }}
        value={currentActiveId}
    >
        {actives.map((a) => (
            <MenuItem value={a.id}>
                {a.title} ({a.amount} {a.currency})
            </MenuItem>
        ))}
    </Select>
);

export default ActiveSelect;
