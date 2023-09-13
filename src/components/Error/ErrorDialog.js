import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

export const ErrorDialog = ({open, onClose, error}) => {
    return (
        <Dialog open = {open} onClose = {onClose} maxWidth = "xs" fullWidth>
            <Alert severity = "error">
                <AlertTitle>Oops! Something goes wrong...</AlertTitle>
                {error}
            </Alert>
            <Button onClick = {onClose} style = {{backgroundColor: "rgb(253, 237, 237)"}}>OK</Button>
        </Dialog>
    );
};
