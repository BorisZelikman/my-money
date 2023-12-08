import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useEffect, useState} from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {DialogContentText, InputAdornment} from "@mui/material";
import DialogActions from "@mui/material/DialogActions";
import {CurrencySelector} from "../Items/CurrencySelector";
import {getCurrencySymbol} from "../../data/currencyMethods";
import AuthStore from "../../Stores/AuthStore";

export const AssetEditDialog = (
    {open, assetEditDialogTitle, assetEditDialogDescription, currencies, selectedCurrencyId, onClose}) => {
    const [assetData, setAssetData] = useState({
        title: "",
        currencyId: selectedCurrencyId,
        amount: 0,
        comment: ""
    });
    const [value, setValue] = useState('');

    const handleInput = (e) => {
        // Remove non-numeric characters using a regular expression
        const numericValue = e.target.value.replace(/[^0-9,.]/g, '');
        setAssetData(() => ({...assetData, amount: numericValue}))
    };
    const  handleAdd = async() => {
      //  addAccountAsset(accountId,assetData.title, assetData.amount, assetData.currencyId, assetData.comment);


    };

    useEffect(() => {
    }, [open]);

    console.log(assetData)
    return (
        <Dialog open = {open} onClose = {onClose} maxWidth = "xs" fullWidth >
            <DialogTitle id="form-dialog-title">{assetEditDialogTitle}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">{assetEditDialogDescription}</DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Title"
                    fullWidth
                    value={assetData.title}
                    onChange={(e)=>{
                        setAssetData(() => ({...assetData, title: e.target.value}))
                    }}
                />
                <div className="horisontalContainer">
                    <TextField
                        label = "Amount" margin="dense"
                        value={assetData.amount}
                        onChange={handleInput}
                    />

                    <CurrencySelector
                        currencies = {currencies} selectedCurrency = {assetData.currencyId}
                        handleCurrencyChange={(e)=>{
                            setAssetData(() => ({...assetData, currencyId: e.target.value}))
                        }}
                    />
                </div>
                <TextField
                    label = "Comment" margin="dense" fullWidth
                    onChange={(e)=>{
                        setAssetData(() => ({...assetData, comment: e.target.value}))
                    }}
                />

            </DialogContent>
            <DialogActions >
                <Button onClick = {()=>onClose(false)} >
                    Cancel
                </Button>
                <Button onClick = {()=>onClose(true,assetData)} >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
};
