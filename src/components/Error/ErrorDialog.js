import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const ErrorDialog = ({open, onClose, error}) => {
    return (
        <Dialog open = {open} onClose = {onClose}>
            <DialogTitle>Error</DialogTitle>
            <DialogContent>{error}</DialogContent>
            <DialogActions>
                <Button onClick = {onClose}>OK</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ErrorDialog;
