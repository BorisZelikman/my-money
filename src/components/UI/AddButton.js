import Button from "@mui/material/Button";

export const AddButton = ({buttonAddClicked}) => (
    <Button
        variant = "contained"
        size = "large"
        style = {{width: 300, marginTop: 10}}
        onClick = {() => buttonAddClicked()}
    >
        Add
    </Button>
);
