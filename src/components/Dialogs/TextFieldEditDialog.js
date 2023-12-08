import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useEffect, useState} from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {DialogContentText} from "@mui/material";
import DialogActions from "@mui/material/DialogActions";

export const TextFieldEditDialog = ({open, dialogTitleText, dialogContentText, textFieldTitle, initialValue, onClose}) => {
    const [textFieldValue, setTextFieldValue]=useState(initialValue)
    useEffect(() => {
        setTextFieldValue(initialValue)
    }, [open]);
    return (
        <Dialog open = {open} onClose = {onClose} maxWidth = "xs" fullWidth>
            <DialogTitle id="form-dialog-title">{dialogTitleText}</DialogTitle>
            <DialogContent>
                <DialogContentText>{dialogContentText}</DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label={textFieldTitle}
                    type="email"
                    fullWidth
                    value={textFieldValue}
                    onChange={(e)=>setTextFieldValue(e.target.value)}
                />
            </DialogContent>
            <DialogActions >
                <Button onClick = {()=>onClose(false)} >
                    Cancel
                </Button>
                <Button onClick = {()=>onClose(true, textFieldValue)} >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
};
