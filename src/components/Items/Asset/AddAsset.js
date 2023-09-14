import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useAssets} from "../../../hooks/useAssets";
import AuthStore from "../../../Stores/AuthStore";

export const AddAsset = () => {
    const navigate = useNavigate();
    const userId = AuthStore.currentUserID;
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
        navigate(`/user-profile/${userId}/balance`);
    }, [actives, userId]);

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {3}>
                <Typography align = "center" variant = "h6">
                    Add new asset to your balance
                </Typography>
                <TextField label = "Type" value = {formData.name}
                           onChange = {(e) => setFormData({...formData, name: e.target.value})}
                />
                <TextField label = "Currency" value = {formData.currencyId}
                           onChange = {(e) => setFormData({...formData, currencyId: e.target.value})}
                />
                <TextField label = "Amount" value = {formData.amount === "" ? 0 : formData.amount}
                           onChange = {(e) =>
                               setFormData({...formData, amount: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                />
                <Button style = {{textDecoration: "none"}} onClick = {handleAdd}>
                    Add
                </Button>
            </Stack>
        </Box>
    );
};
