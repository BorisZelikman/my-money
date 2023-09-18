import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export const TransferFields = ({rateCaption, rate, handleRateChange}) => {
    return (
        <>
            <Box sx = {{width: "100%", display: "flex", alignItems: "center"}}>
                <Typography variant = "body1" gutterBottom sx = {{width: "70%"}}>
                    {rateCaption}
                </Typography>
                <TextField
                    sx = {{width: "30%", backgroundColor: "white"}}
                    label = "Rate"
                    type = "number"
                    value = {rate}
                    size="small"
                    onChange = {handleRateChange}
                />
            </Box>
        </>
    );
};
