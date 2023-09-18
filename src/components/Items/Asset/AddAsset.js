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
import {CurrencySelector} from "../CurrencySelector";
import {useCurrencies} from "../../../hooks/useCurrencies";
import {getCurrencySymbol} from "../../../data/currencyMethods";

export const AddAsset = () => {
    const {currencies, getCurrencies} = useCurrencies();

    const navigate = useNavigate();
    const {assets, addAsset} = useAssets();
    const userId = AuthStore.currentUserID;
    const [formData, setFormData] = useState({
        name: "",
        currencyId: "ILS",
        amount: 0,
        comment: ""
    });
    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isSmallWidthScreen = useMediaQuery("(max-width: 500px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 501px) and (max-width: 700px)");

    useEffect(() => {
        getCurrencies();
    }, []);

    useEffect(() => {
        if (assets.length === 0) {
            return;
        }
        setFormData({name: "", currencyId: "", amount: 0});
        navigate(`/user-profile/${userId}`);
    }, [assets, userId]);

    const handleAdd = () => {
        addAsset(userId, formData.name, formData.amount, formData.currencyId, formData.comment);
    };

    const getInputWidth = () => {
        if (isSmallWidthScreen) {
            return "90%";
        } else if (isMediumWidthScreen) {
            return "70%";
        } else {
            return "40%";
        }
    };

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                py: 2,
                backgroundColor: "rgb(243, 156, 18)"
            }}>
                <Typography align = "center" variant = "h6">
                    ADD NEW ASSET
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: getInputWidth(),
                gap: 1,
                mt: isSmallHeightScreen ? 1 : 10
            }}>
                <TextField label = "Title" value = {formData.name} fullWidth required
                           onChange = {(e) => setFormData({...formData, name: e.target.value})}
                />
                <CurrencySelector currencies = {currencies} selectedCurrency = {formData.currencyId}
                                  handleCurrencyChange = {(e) => setFormData({...formData, currencyId: e.target.value})}/>
                <TextField label = "Amount" value = {formData.amount === "" ? 0 : formData.amount}
                           fullWidth
                           InputProps = {{
                               endAdornment: (
                                   <InputAdornment
                                       position = "end">{getCurrencySymbol(currencies, formData.currencyId)}</InputAdornment>
                               )
                           }}
                           onChange = {(e) =>
                               setFormData({...formData, amount: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                />
                <TextField label = "Comment" value = {formData.comment} fullWidth
                           variant = "outlined"
                           onChange = {(e) => setFormData({...formData, comment: e.target.value})}
                />
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                gap: 10,
                py: 1
            }}>
                <Button onClick = {() => navigate(`/user-profile/${userId}`)} variant = "contained" color = "error">
                    Cancel
                </Button>
                <AddButton disabled = {!formData.name} buttonAddClicked = {handleAdd}/>
            </Box>
        </Box>
    );
};
