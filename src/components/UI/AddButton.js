import Button from "@mui/material/Button";

export const AddButton = ({disabled, buttonAddClicked}) => (
    <Button
        disabled={disabled}
        variant = "contained"
        style = {{alignSelf:"stretch"}}
        onClick = {() => buttonAddClicked()}
    >
        Add
    </Button>
);
