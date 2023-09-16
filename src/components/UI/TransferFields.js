import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export const TransferFields = ({transferToAssets, transferToAssetId, handleTransferToAssetChange, rate, handleRateChange}) => {
    return (
        <>
            <Box sx = {{width: "100%", display: "flex", alignItems: "center"}}>
                <Typography variant = "body1" gutterBottom sx = {{width: "70%"}}>
                    Transfer rate
                </Typography>
                <TextField
                    sx = {{width: "30%"}}
                    label = "Rate"
                    type = "number"
                    value = {rate}
                    onChange = {handleRateChange}
                />
            </Box>
        </>
    );
};
