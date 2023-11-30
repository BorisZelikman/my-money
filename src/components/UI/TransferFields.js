import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export const TransferFields = ({rateCaption, rate, onRateChange}) => {
    return (
        <>
            <Box sx = {{width: "100%", display: "flex", alignItems: "center"}}>
                <Typography variant = "body1" gutterBottom sx = {{width: "70%"}}>
                    {rateCaption}
                </Typography>
                <TextField className="input-field"
                    size="small"
                    sx = {{width: "30%"}}
                    label = "Rate"
                    type = "number"
                    value = {rate}
                    onChange = {onRateChange}
                />
            </Box>
        </>
    );
};
