import React from 'react';
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";

const ToggleButtons = ({ operationType, handleOperationTypeChange }) => (
    <ToggleButtonGroup
        color="primary"
        value={operationType}
        exclusive
        onChange={handleOperationTypeChange}
        aria-label="Platform"
    >
        <ToggleButton value="payment">Payment</ToggleButton>
        <ToggleButton value="incoming">Incoming</ToggleButton>
        <ToggleButton value="transfer">Transfer</ToggleButton>
        <ToggleButton value="history">History</ToggleButton>
    </ToggleButtonGroup>
);

export default ToggleButtons;
