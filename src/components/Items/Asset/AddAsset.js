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
import {getCurrencySymbol} from "../../../data/currencyMethods";
import {useAccounts} from "../../../hooks/useAccounts";
import authStore from "../../../Stores/AuthStore";
import {AccountSelect} from "../../UI/AccountSelect";
import Stack from "@mui/material/Stack";

export const AddAsset = () => {
    const navigate = useNavigate();
    const {assets, addAsset} = useAssets();
    const {accounts, getAccounts, addAccount} = useAccounts();

    const [currentAccountId, setCurrentAccountId]= useState(null);

    const userId = AuthStore.currentUserID;
    const currencies = AuthStore.currencies;
    const userAccounts = AuthStore.userAccounts;

    const [formData, setFormData] = useState({
        account:"",
        name: "",
        currencyId: "ILS",
        amount: 0,
        comment: ""
    });
    const [accountsDataForUser,setAccountsDataForUser]=useState([])
    const isSmallHeightScreen = useMediaQuery("(max-height: 420px)");
    const isSmallWidthScreen = useMediaQuery("(max-width: 500px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 501px) and (max-width: 700px)");
    
    if (userId === null) {
      navigate(`/`);
    }

    useEffect(() => {
        if (userAccounts.length>0) getAccounts();
    }, []);

    useEffect(() => {
        if (userAccounts.length>0 && accounts.length>0)
        setAccountsDataForUser(accounts.filter(obj => userAccounts.includes(obj.id)));
    }, [accounts]);

    useEffect(() => {
        console.table (authStore.userAccounts)
        console.table (authStore.userNamesOfAccounts)
        if (AuthStore.userAccounts.length===0) console.log("empty/ need to add")
        if (assets.length === 0) {
            return;
        }
        setFormData({name: "", currencyId: "", amount: 0});
        navigate(`/user-profile`);
    }, [assets]);

    useEffect(() => {
        console.log("useEffect currentAccountId: ",currentAccountId);
    }, [currentAccountId]);

    const  handleAdd = async() => {
        if (AuthStore.userAccounts.length===0) {await addAccount(userId)}
//        addAsset(userId, formData.name, formData.amount, formData.currencyId, formData.comment);

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
    const handleAccountsChange = (event) => {
        console.log("handleAccountsChange event.target.value", event.target.value);
        if (event.target.value==="New account...") {
            setCurrentAccountId("New account...");
        } else {
            setCurrentAccountId(event.target.value);
        }
    };


    return (
        <Stack className="page">
            <Box className="title-box" >
                <Typography variant = "h5">
                    Add new asset
                </Typography>
            </Box>
            <Box spacing = {1.2}
                   sx = {{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "center",
                       justifyContent: "center",
                       marginTop: "8px",
                       width: "90%"
                   }}>
                <AccountSelect caption = "Select account" accounts={accountsDataForUser} currentAccountId = {currentAccountId}
                             handleAccountsChange={handleAccountsChange} showNewAccount={true}


                />

                <TextField label = "Title" value = {formData.name} fullWidth required
                           sx = {{backgroundColor: "white"}}
                           onChange = {(e) => setFormData({...formData, name: e.target.value})}
                />
                <CurrencySelector currencies = {currencies} selectedCurrency = {formData.currencyId}
                                  sx = {{backgroundColor: "white"}}
                                  handleCurrencyChange = {(e) => setFormData({...formData, currencyId: e.target.value})}/>
                <TextField label = "Amount" value = {formData.amount === "" ? 0 : formData.amount}
                           fullWidth
                           sx = {{backgroundColor: "white"}}
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
                           sx = {{backgroundColor: "white"}}
                           variant = "outlined"
                           onChange = {(e) => setFormData({...formData, comment: e.target.value})}
                />
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: isSmallWidthScreen ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                gap: 1,
                py: 1
            }}>
                <AddButton disabled = {!formData.name} buttonAddClicked = {handleAdd}/>
                <Button sx = {{width: "200px"}} onClick = {() => navigate(`/user-profile`)}
                        variant = "contained" color = "error">
                    Cancel
                </Button>
            </Box>
        </Stack>
    );
};
