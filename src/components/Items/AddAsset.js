import {useNavigate, useParams} from "react-router-dom";
import {addActive} from "../../data/activeMethods";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useState} from "react";

export const AddAsset = () => {
    const navigate = useNavigate();
    const {userId} = useParams();
    const [formData, setFormData] = useState({
        name: "",
        currencyId: "",
        amount: 0
    });

    const handleAdd = () => {
        if (isNaN(formData.amount)) {
            console.error("Amount must be a number");
            return;
        }

        const newActive = addActive(formData.name, formData.currencyId, formData.amount);
        if (newActive) {
            setFormData({name: "", currencyId: "", amount: 0});
            navigate(`/user-profile/${userId}/balance`);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {3}>
                <Typography align = "center" variant = "h6" margin = "normal">
                    Add new asset to your balance
                </Typography>
                <TextField label = "Type" value = {formData.name}
                           onChange = {(e) => setFormData({...formData, name: e.target.value})}
                />
                <TextField label = "Currency" value = {formData.currencyId}
                           onChange = {(e) => setFormData({...formData, currencyId: e.target.value})}
                />
                <TextField label = "Amount" value = {formData.amount === "" ? 0 : formData.amount}
                           onChange = {(e) => setFormData({...formData, amount: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                />
                <Button style = {{textDecoration: "none"}} onClick = {handleAdd}>
                    Add
                </Button>
            </Stack>
        </Box>
    );
};
