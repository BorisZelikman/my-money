import Button from "@mui/material/Button";

export const AddButton = ({buttonAddClicked}) => (
    <Button onClick = {() => buttonAddClicked()}>
        Add
    </Button>
);
