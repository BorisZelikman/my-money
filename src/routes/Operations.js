import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
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
import {getCurrencyOfAsset, getCurrencySymbolOfAsset, getExchangeRate} from "../data/currencyMethods";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {useAccounts} from "../hooks/useAccounts";

export const Operations = observer(() => {
    const [operationType, setOperationType] = useState("payment");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const [transferToAssets, setTransferToAssets] = useState("");
    const [transferToAssetId, setTransferToAssetId] = useState("");
    const [rate, setRate] = useState(1);
    const [rateCaption, setRateCaption] = useState("Transfer rate");
    const [currentCategory, setCurrentCategory] = useState("");
    const [title, setTitle] = useState("");
    const [sum, setSum] = useState();
    const [comment, setComment] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const {userPreference, getUserPreference, updateUserPreference} =        useUserPreference();
    const {accounts, getAccounts, addAccount} = useAccounts();
    const {assets, getAssets, updateAssetField, addAccountAsset} = useAssets();
    const {operations, getOperations, getAccountAssetOperations, addOperation, addAccountAssetOperation} = useOperations();
    const userId = AuthStore.currentUserID;
    const currencies = AuthStore.currencies;
    const isSmallWidthScreen = useMediaQuery("(max-width: 450px)");
    const isSmallHeightScreen = useMediaQuery("(max-height: 550px)");

    const navigate = useNavigate();
    const assetById =(id)=> assets.find((a) => a.id === id);

    useEffect(() => {
        if (userId === null) {
            navigate(`/`);
        }
        else {
            getUserPreference(userId)
        }
    }, []);

    useEffect(()=>{
        if (userPreference===undefined || userPreference?.length===0) return
        const userAccounts=userPreference.accounts;
        const assetsSettings= userPreference.assets ? userPreference.assets : [];
        getAssets(userAccounts, assetsSettings);
        if (userPreference.currentAssetId) setCurrentAssetId(userPreference.currentAssetId);
        if (userPreference.operationType) setOperationType(userPreference.operationType);
    },[userPreference])

    // useEffect(() => {
    //     if (user) {
    //         getAssets(userId);
    //         getUserPreference(userId);
    //
    //         if (user && currentAssetId) {
    //             getOperations(userId, currentAssetId);
    //         }
    //
    //     }
    // }, [user]);
    //
    // useEffect(() => {
    //     if (userPreference) {
    //         setCurrentAssetId(userPreference.currentAssetId);
    //         if (userPreference.operationType) {
    //             setOperationType(userPreference.operationType);
    //         }
    //         if (currentAssetId) {
    //             getOperations(user.uid, currentAssetId);
    //         }
    //     }
    // }, [userPreference]);

    useEffect(() => {
        if (currentAssetId && assets?.length>0) {
            //getOperations(userId, currentAssetId);
            getAccountAssetOperations(assetById(currentAssetId)?.accountId, currentAssetId);
        }

        // in list of transferTo shouldn't be currentAssetId
        if (assets) {
            setTransferToAssets(assets.filter((a) => a.id !== currentAssetId));
        }
    }, [currentAssetId, assets]);

    useEffect(() => {
        const fetchData = async (from, to) => {
            const exchangeRate = from === to ? 1 : await getExchangeRate(from, to);
            setRate(exchangeRate);
        };

        if (operationType === "transfer" && currentAssetId !== "" && transferToAssetId !== "") {
            if (currentAssetId === transferToAssetId) {
                setTransferToAssetId("")
                setTitle("");
            }
            else {
                const fromAssetCurrency = getCurrencyOfAsset(assets, currentAssetId);
                const toAssetCurrency = getCurrencyOfAsset(assets, transferToAssetId);
                fetchData(fromAssetCurrency, toAssetCurrency);
                setRateCaption(`Transfer rate (${fromAssetCurrency} - ${toAssetCurrency})`);
                setTitle(assetById(currentAssetId).title + "->" + assetById(transferToAssetId).title);
            }
        }
    }, [currentAssetId, transferToAssetId]);

    useEffect(() => {
//        console.table(operations)
    }, [operations]);

    const handleOperationTypeChange = (event, newType) => {
        setOperationType(event.target.value);
    };
    const handleAssetChange = (event) => {
        setCurrentAssetId(event.target.value);
        validateForm(title, sum, event.target.value, transferToAssetId);
    };
    const handleTransferToAssetChange = (event) => {
        setTransferToAssetId(event.target.value);
        validateForm(title, sum, currentAssetId, event.target.value);
    };
    const handleCategoryChange = (event) => {
        setCurrentCategory(event.target.value);
    };
    const handleTitleChange = (event) => {
        setTitle(event.target.value);
        validateForm(event.target.value, sum, currentAssetId, transferToAssetId);
    };
    const handleRateChange = (event) => {
        setRate(event.target.value);
    };
    const handleSumChange = (event) => {
        setSum(event.target.value);
        validateForm(title, event.target.value, currentAssetId, transferToAssetId);
    };
    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    // enable buttonAdd only if all required fields are filled
    const validateForm = (title, sum, assetId, transferToId) => {
        let ok = title.trim() !== "" && Number(sum) > 0 && assetId !== "";
        if (operationType === "transfer") {
            ok = ok && transferToId !== "";

        }
        if (ok) {
            setIsButtonDisabled(false); // Enable the button if both fields are filled
        } else {
            setIsButtonDisabled(true); // Disable the button if any required field is empty
        }
    };

    const copyToAccounts=async ()=>{
        // await addAccountAssetOperation("hbZZp3FEyn8GsI1n8onO","5jHuNfnD22K0UcHzlBe4",
        //     "aaa","test",123);
        // return

        const newAccountId=await addAccount(userId);
        await updateUserPreference(userId, "newAccountId", newAccountId);

        //console.table(assets)
        for (const asset of assets) {
            const newAssetId= await addAccountAsset(newAccountId,asset.title,asset.amount, asset.currency, asset.comment);
            let opers=await getOperations(userId, asset.id)

            //console.log(newAssetId);

            for (const operation of opers) {
                await addAccountAssetOperation(newAccountId,newAssetId,
                    operation.type,operation.title,operation.amount,
                    operation.category,operation.comment,operation.datetime,userId);
            }

        }

    }

    const buttonAddClicked = async () => {
        await addAccountAssetOperation(
            assetById(currentAssetId).accountId,
            currentAssetId,
            operationType,
            title,
            sum,
            operationType === "transfer" ? "transfer from" : currentCategory,
            comment,
            new Date(),
            userId
        );

        let assetAmount = assetById(currentAssetId).amount;

        await updateAssetField(
            assetById(currentAssetId).accountId,
            currentAssetId,
            "amount",
            operationType === "income"
                ? assetAmount + Number(sum)
                : assetAmount - Number(sum)
        );

        if (operationType === "transfer") {
            await addAccountAssetOperation(
                assetById(transferToAssetId).accountId,
                transferToAssetId,
                operationType,
                title,
                sum * rate,
                "transfer to",
                comment,
                new Date(),
                userId
            );
            assetAmount = assetById(transferToAssetId).amount;

            await updateAssetField(
                assetById(transferToAssetId).accountId,
                transferToAssetId,
                "amount",
                assetAmount + Number(sum * rate)
            );
        }

        updateUserPreference(userId, "currentAssetId", currentAssetId);
        updateUserPreference(userId, "transferToAssetId", transferToAssetId);
        updateUserPreference(userId, "operationType", operationType);

        validateForm("", 0, currentAssetId, transferToAssetId);
        setTitle("");
        setComment("");
        setSum(0);

        const userAccounts=userPreference.accounts;
        const assetsSettings= userPreference.assets ? userPreference.assets : [];
        getAssets(userAccounts, assetsSettings);

    };

    const allowTwoColumn = !isSmallWidthScreen && operationType === "transfer";

    return (
        <Box className="page">
            <Box className="title-box" >
                <Typography variant = "h5">
                    Operations
                </Typography>
            </Box>
            <Stack spacing = {1.2}
                   sx = {{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "center",
                       justifyContent: "center",
                       marginTop: "8px",
                       width: "90%"
                   }}>
                <ToggleButtons operationType = {operationType} handleOperationTypeChange = {handleOperationTypeChange}/>
                {allowTwoColumn ? (
                    <Grid container>
                        <Grid item xs = {6} sx = {{pr: 1}}>
                            <AssetSelect caption = "From" assets = {assets} currentAssetId = {currentAssetId}
                                         handleAssetChange = {handleAssetChange}/>
                        </Grid>
                        <Grid item xs = {6}>
                            <AssetSelect caption = "To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                         handleAssetChange = {handleTransferToAssetChange}/>
                        </Grid>
                    </Grid>) : (
                    <>
                        <AssetSelect caption = {operationType === "income" ? "To" : "From"} assets = {assets}
                                     currentAssetId = {currentAssetId} handleAssetChange = {handleAssetChange}/>
                        {operationType === "transfer" ? (
                            <AssetSelect caption = "To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                         handleAssetChange = {handleTransferToAssetChange}/>
                        ) : null}
                    </>
                )}
                {operationType !== "transfer" && (
                    <TextField className="input-field" fullWidth
                               size="small"
                        label = "Category"
                        value = {currentCategory}
                        onChange = {handleCategoryChange}
                    />
                    // !!!!! To restore in future !!!!!
                    // <Autocomplete
                    //     disablePortal
                    //     id = "combo-box-demo"
                    //     sx = {{width: "100%", backgroundColor: "white"}}
                    //     options = {["food", "wear", "sport"]}
                    //     value={currentCategory}
                    //     onChange = {handleCategoryChange}
                    //     freeSolo
                    //     renderInput = {(params) => <TextField {...params} label = "Category"/>}
                    // />
                )}

                {operationType === "transfer" && (
                    <TransferFields
                        rateCaption = {rateCaption}
                        rate = {rate}
                        handleRateChange = {handleRateChange}
                    />
                )}

                <InputFields
                    title = {title}
                    sum = {sum}
                    comment = {comment}
                    currencySymbol = {getCurrencySymbolOfAsset(assets, currentAssetId, currencies)}
                    handleTitleChange = {handleTitleChange}
                    handleSumChange = {handleSumChange}
                    handleCommentChange = {handleCommentChange}
                />
                <AddButton disabled = {isButtonDisabled} buttonAddClicked = {buttonAddClicked}/>
            </Stack>

            {!isSmallHeightScreen && ( <Stack sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mt:2,
                width: "90%"
            }}>
                <Typography variant = "h6">
                    Last operations
                </Typography>
                <OperationsTable assets = {assets} operations = {operations} currencies = {currencies} count = {3}/>
            </Stack>)}
        </Box>
    );
});
