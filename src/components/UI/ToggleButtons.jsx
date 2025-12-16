import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import {useState} from "react";

export const ToggleButtons = ({operationType, handleOperationTypeChange}) => {
    const [selectedButton, setSelectedButton] = useState('');

    const handleButtonChange = (event, newButton) => {
        setSelectedButton(newButton);
    };

    return (

    <ToggleButtonGroup
        sx = {{
            backgroundColor: "#ecf0f1",
            color:"orange"
        }}
        color = "primary"
        value = {operationType}
        exclusive
        onChange = {handleOperationTypeChange}
        aria-label = "Platform"

    >
        <ToggleButton value = "payment">Payment</ToggleButton>
        <ToggleButton value = "income">Income</ToggleButton>
        <ToggleButton value = "transfer">Transfer</ToggleButton>
    </ToggleButtonGroup>
)};
