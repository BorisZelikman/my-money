import {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import {ToggleButtons} from "../components/UI/ToggleButtons";
import {AssetSelect} from "../components/UI/AssetSelect";
import {InputFields} from "../components/UI/InputFields";
import {useAssets} from "../hooks/useAssets";
import {AddButton} from "../components/UI/AddButton";
import {TransferFields} from "../components/UI/TransferFields";
import {useOperations} from "../hooks/useOperations";
import {useUserPreference} from "../hooks/useUserPreference";
import {OperationsTable} from "../components/Items/OperationsTable";
import AuthStore from "../Stores/AuthStore";
import {observer} from "mobx-react";
import {useCurrencies} from "../hooks/useCurrencies";
import {getCurrencyOfAsset, getExchangeRate} from "../data/currencyMethods";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Grid} from "@mui/material";

export const Operations = observer(() => {
    const [user, setUser] = useState(null);

    const [operationType, setOperationType] = useState("payment");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const [transferToAssets, setTransferToAssets] = useState("");
    const [transferToAssetId, setTransferToAssetId] = useState("");
    const [rate, setRate] = useState(1);
    const [rateCaption, setRateCaption] = useState("Transfer rate");
    const [currentCategory, setCurrentCategory] = useState("");
    const [title, setTitle] = useState("");
    const [sum, setSum] = useState(0);
    const [comment, setComment] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const {userPreference, getUserPreference, updateUserPreference} =
        useUserPreference();
    const {assets, getAssets, updateAssetField} = useAssets();
    const {operations, getOperations, getAllOperations, addOperation} = useOperations();
    const {currencies, getCurrencies} = useCurrencies();
    const userId = AuthStore.currentUserID;
    const isSmallWidthScreen = useMediaQuery("(max-width: 450px)");

    useEffect(() => {
        if (AuthStore.currentUser) {
            setUser(AuthStore.currentUser);
        } else {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        if (user) {

            getAssets(AuthStore.currentUserID);
            getUserPreference(AuthStore.currentUserID);

            if (user && currentAssetId) {
                getOperations(AuthStore.currentUserID, currentAssetId);
            }

        }
    }, [user]);

    useEffect(() => {
        if (user && assets) {
            getAllOperations(AuthStore.currentUserID, assets);
        }
    }, [assets]);


    useEffect(() => {
        if (userPreference) {
            setCurrentAssetId(userPreference.currentAssetId);
            setOperationType(userPreference.operationType);
            if (currentAssetId) {
                getOperations(user.uid, currentAssetId);
            }
        }
    }, [userPreference]);

    useEffect(() => {
        if (currentAssetId) {
            getOperations(user.uid, currentAssetId);
        }

        // in list of transferTo shouldn't be currentAssetId
        if (assets) {
            setTransferToAssets(assets.filter((a) => a.id !== currentAssetId));
        }
    }, [currentAssetId, assets]);

    useEffect(() => {
        const fetchData = async (from, to) => {
            const exchangeRate = from===to ? 1 : await getExchangeRate(from, to);
            setRate(exchangeRate);
        };

        if (operationType==="transfer" && currentAssetId!=='' && transferToAssetId!=='') {
            const fromAssetCurrency=getCurrencyOfAsset(assets, currentAssetId);
            const toAssetCurrency=getCurrencyOfAsset(assets, transferToAssetId);
            fetchData(fromAssetCurrency, toAssetCurrency)
            setRateCaption(`Transfer rate (${fromAssetCurrency} - ${toAssetCurrency})`);
        }
    }, [currentAssetId, transferToAssetId]);


    const handleOperationTypeChange = (event, newType) => {
        setOperationType(event.target.value);
    };
    const handleAssetChange = (event) => {
        setCurrentAssetId(event.target.value);
        validateForm(title,sum,event.target.value,transferToAssetId)
    };
    const handleTransferToAssetChange = (event) => {
        setTransferToAssetId(event.target.value);
        validateForm(title,sum,currentAssetId,event.target.value)
    };
    const handleCategoryChange = (event) => {
        setCurrentCategory(event.target.value);
    };
    const handleTitleChange = (event) => {
        setTitle(event.target.value);
        validateForm(event.target.value,sum,currentAssetId,transferToAssetId)
    };
    const handleRateChange = (event) => {
        setRate(event.target.value);
    };
    const handleSumChange = (event) => {
        setSum(event.target.value);
        validateForm(title, event.target.value, currentAssetId,transferToAssetId)
    };
    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    // enable buttonAdd only if all required fields are filled
    const validateForm = (title, sum, assetId, transferToId) => {
        let ok =title.trim() !== '' && sum>0 && assetId!=="";
        if (operationType==="transfer") ok=ok && transferToId!=="";
        if (ok) {
            setIsButtonDisabled(false); // Enable the button if both fields are filled
        } else {
            setIsButtonDisabled(true); // Disable the button if any required field is empty
        }
    };

    const buttonAddClicked = () => {
        addOperation(
            user.uid,
            currentAssetId,
            operationType,
            title,
            sum,
            operationType === "transfer" ? "transfer from" : currentCategory,
            comment,
            new Date()
        );

        let assetAmount = assets.filter((a) => a.id === currentAssetId)[0]
            .amount;

        updateAssetField(
            user.uid,
            currentAssetId,
            "amount",
            operationType === "income"
                ? assetAmount + Number(sum)
                : assetAmount - Number(sum)
        );

        if (operationType === "transfer") {
            addOperation(
                user.uid,
                transferToAssetId,
                operationType,
                title,
                sum * rate,
                "transfer to",
                comment,
                new Date()
            );
            assetAmount = assets.filter((a) => a.id === transferToAssetId)[0]
                .amount;

            updateAssetField(
                user.uid,
                transferToAssetId,
                "amount",
                assetAmount + Number(sum * rate)
            );
        }
        updateUserPreference(user.uid, "currentAssetId", currentAssetId);
        updateUserPreference(user.uid, "transferToAssetId", transferToAssetId);
        updateUserPreference(user.uid, "operationType", operationType);

        validateForm("",0,currentAssetId, transferToAssetId);
        setTitle("");
        setComment("");
        setSum(0);
    };

    const allowTwoColumn=!isSmallWidthScreen && operationType==="transfer";

    return (
        <Box
            sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width:"100%"
            }}
        >
            <Stack spacing = {1.2}
                   sx = {{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "center",
                       justifyContent: "center",
                       marginTop: "8px",
                       width:"90%"

                   }}
            >
                <ToggleButtons operationType = {operationType} handleOperationTypeChange = {handleOperationTypeChange}/>
                {allowTwoColumn ? (
                <Grid container>
                    <Grid item xs={6}>
                        <AssetSelect caption="From" assets = {assets} currentAssetId = {currentAssetId}
                                     handleAssetChange = {handleAssetChange}/>
                    </Grid>
                    <Grid item xs={6} >
                        <AssetSelect caption="To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                     handleAssetChange = {handleTransferToAssetChange}/>
                    </Grid>
                </Grid>):(
                    <>
                        <AssetSelect caption={operationType==="income" ?"To":"From"} assets = {assets}
                                     currentAssetId = {currentAssetId} handleAssetChange = {handleAssetChange}/>
                        {operationType==="transfer" ?(
                            <AssetSelect caption="To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                     handleAssetChange = {handleTransferToAssetChange}/>
                        ):null}
                    </>
                )}
                {operationType !== "transfer" && (
                    <Autocomplete
                        disablePortal
                        id = "combo-box-demo"
                        sx = {{width: "100%"}}
                        options = {["food", "wear", "sport"]}
                        onChange = {handleCategoryChange}
                        freeSolo
                        renderInput = {(params) => <TextField {...params} label = "Category"/>}
                    />
                )}

                {operationType === "transfer"  &&(
                    <TransferFields
                        rateCaption={rateCaption}
                        rate = {rate}
                        handleRateChange = {handleRateChange}
                    />
                )}

                <>
                    <InputFields
                        title = {title}
                        sum = {sum}
                        comment = {comment}
                        handleTitleChange = {handleTitleChange}
                        handleSumChange = {handleSumChange}
                        handleCommentChange = {handleCommentChange}
                    />
                    <AddButton disabled={isButtonDisabled} buttonAddClicked = {buttonAddClicked}/>
                </>
            </Stack>
            <OperationsTable id = "shortOperations" operations = {operations}/>

        </Box>
    );
});
