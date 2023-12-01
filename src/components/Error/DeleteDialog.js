import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";

export const DeleteDialog = ({open, text, onClose}) => {
    return (
        <Dialog open = {open} onClose = {onClose} maxWidth = "xs" fullWidth>
            <Alert severity = "warning">
                <AlertTitle>Are you sure?</AlertTitle>
                {text}
            </Alert>
            <div className="horisontalContainer transparent" >
                <Button onClick = {()=>onClose(false)} >Cancel</Button>
                <Button onClick = {()=>onClose(true)} >Delete</Button>
            </div >
        </Dialog>
    );
};
