import Button from "@mui/material/Button";

export const AddButton = ({disabled, buttonAddClicked}) => (
    <Button
        disabled = {disabled}
        variant = "contained"
        sx = {{width: "200px"}}
        onClick = {() => buttonAddClicked()}
    >
        Add
    </Button>
);
