import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";

export const ToggleButtons = ({operationType, handleOperationTypeChange}) => (
    <ToggleButtonGroup
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
);
