import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useAssets} from "../../../hooks/useAssets";
import {InputAdornment} from "@mui/material";
import {AddButton} from "../../UI/AddButton";
import AuthStore from "../../../Stores/AuthStore";
import useMediaQuery from "@mui/material/useMediaQuery";

export const AddAsset = () => {
    const navigate = useNavigate();
    const {assets, addAsset} = useAssets();
    const userId = AuthStore.currentUserID;
    const [formData, setFormData] = useState({
        name: "",
        currencyId: "",
        amount: 0
    });
    const isSmallWidthScreen = useMediaQuery("(max-width: 500px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 501px) and (max-width: 700px)");

    useEffect(() => {
        if (assets.length === 0) {
            return;
        }
        setFormData({name: "", currencyId: "", amount: 0});
        navigate(`/user-profile/${userId}`);
    }, [assets, userId]);

    const handleAdd = () => {
        addAsset(userId, formData.name, formData.amount, formData.currencyId);
    };

    const getInputWidth = () => {
        if (isSmallWidthScreen) {
            return "90%";
        } else if (isMediumWidthScreen) {
            return "50%";
        } else {
            return "25%";
        }
    };

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                gap: 1,
                py: 3
            }}>
                <Typography align = "center" variant = "h6">
                    ADD NEW ASSET
                </Typography>
                <TextField label = "Title" value = {formData.name} sx = {{width: getInputWidth()}}
                           onChange = {(e) => setFormData({...formData, name: e.target.value})}
                />
                <TextField label = "Currency" value = {formData.currencyId} sx = {{width: getInputWidth()}}
                           onChange = {(e) => setFormData({...formData, currencyId: e.target.value})}
                />
                <TextField label = "Amount" value = {formData.amount === "" ? 0 : formData.amount}
                           sx = {{width: getInputWidth()}}
                           InputProps = {{
                               startAdornment: (
                                   <InputAdornment position = "start">
                                       $
                                   </InputAdornment>
                               )
                           }}
                           onChange = {(e) =>
                               setFormData({...formData, amount: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                />
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                gap: 10,
                py: 3
            }}>
                <AddButton buttonAddClicked = {handleAdd}/>
                <Button onClick = {() => navigate(`/user-profile/${userId}`)}>
                    Cancel
                </Button>
            </Box>
        </Box>
    );
};
