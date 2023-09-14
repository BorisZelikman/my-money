import Button from "@mui/material/Button";

export const AddButton = ({buttonAddClicked}) => (
    <Button
        variant = "contained"
        style = {{marginBottom:25}}
        onClick = {() => buttonAddClicked()}
    >
        Add
    </Button>
);
