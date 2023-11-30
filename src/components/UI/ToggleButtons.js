import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import {useState} from "react";

export const ToggleButtons = ({operationType, onOperationTypeChange}) => {
return (
    <ToggleButtonGroup
        color = "standard"
        value = {operationType}
        exclusive
        onChange = {onOperationTypeChange}
        aria-label = "Platform"
    >
        <ToggleButton value = "payment" sx={{py:1}}>Payment</ToggleButton>
        <ToggleButton value = "income" sx={{py:1}}>Income</ToggleButton>
        <ToggleButton value = "transfer" sx={{py:1}}>Transfer</ToggleButton>
    </ToggleButtonGroup>
)};
