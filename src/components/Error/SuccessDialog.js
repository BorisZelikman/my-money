import React from "react";
import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";

export const SuccessDialog = ({open, onClose}) => {
    return (
        <Dialog open = {open} onClose = {onClose} maxWidth = "xs" fullWidth>
            <Alert severity = "success">
                <AlertTitle>Registration Successful</AlertTitle>
                You have successfully registered
            </Alert>
            <Button onClick = {onClose} style = {{backgroundColor: "rgb(237, 247, 237)"}}>OK</Button>
        </Dialog>
    );
};
