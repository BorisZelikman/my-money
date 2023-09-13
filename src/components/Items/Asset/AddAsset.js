import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useAssets} from "../../../hooks/useAssets";
import {Grid, InputAdornment} from "@mui/material";
import {AddButton} from "../../UI/AddButton";

export const AddAsset = () => {
    const navigate = useNavigate();
    const {userId} = useParams();
    const {actives, addAsset} = useAssets();

    const [formData, setFormData] = useState({
        name: "",
        currencyId: "",
        amount: 0
    });

    const handleAdd = () => {
        addAsset(userId, formData.name, formData.amount, formData.currencyId);
    };

    useEffect(() => {
        if (actives.length === 0) {
            return;
        }
        setFormData({name: "", currencyId: "", amount: 0});
        navigate(`/user-profile/${userId}`);
    }, [actives]);

    const buttonAddClicked = () => {
        navigate(`/user-profile/${userId}`)
    }

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {3}>
                <Typography align = "center" variant = "h6">
                    Add new asset
                </Typography>
                <TextField label = "Title" value = {formData.name}
                           onChange = {(e) => setFormData({...formData, name: e.target.value})}
                />
                <TextField label = "Currency" value = {formData.currencyId}
                           onChange = {(e) => setFormData({...formData, currencyId: e.target.value})}
                />
                <TextField label = "Amount" value = {formData.amount === "" ? 0 : formData.amount}
                           variant="outlined"
                           InputProps={{
                               startAdornment: (
                                   <InputAdornment position="start">
                                       $
                                   </InputAdornment>
                               ),
                           }}
                           onChange = {(e) =>
                               setFormData({...formData, amount: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                />
                <Grid container spacing={0} style ={{justifyContent: "space-between"}} >
                    <Grid item>
                        <Button style = {{textDecoration: "none"}} color="secondary" variant="contained"
                                onClick = {()=>navigate(`/user-profile/${userId}`)}>
                            Cancel
                        </Button>
                    </Grid>
                    <Grid item><AddButton buttonAddClicked = {handleAdd}/></Grid>
                </Grid>
            </Stack>
        </Box>
    );
};
