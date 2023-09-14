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

export const Operations = observer(() => {
    const [user, setuser] = useState(null);

    const [operationType, setOperationType] = useState("payment");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const [transferToAssets, setTransferToAssets] = useState("");
    const [transferToAssetId, setTransferToAssetId] = useState("");
    const [rate, setRate] = useState(1);
    const [currentCategory, setCurrentCategory] = useState("");
    const [title, setTitle] = useState("");
    const [sum, setSum] = useState(0);
    const [comment, setComment] = useState("");

    const {userPreference, getUserPreference, updateUserPreference} =
        useUserPreference();
    const {assets, getAssets, updateAssetField} = useAssets();
    const {operations, getOperations, addOperation} = useOperations();

    useEffect(() => {
        if (AuthStore.currentUser) {
            setuser(AuthStore.currentUser);
        } else {
            setuser(null);
        }
    }, []);

    useEffect(() => {
        if (user) {
            getAssets(user.uid);
            getUserPreference(user.uid);
            if (user && currentAssetId) {
                getOperations(user.uid, currentAssetId);
            }
        }
    }, [user]);

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
        if (assets) {
            setTransferToAssets(assets.filter((a) => a.id !== currentAssetId));
        }
    }, [currentAssetId]);

    useEffect(() => {
        if (currentAssetId) {
            getOperations(user.uid, currentAssetId);
        }
    }, [currentAssetId]);

    const handleOperationTypeChange = (event, newType) => {
        setOperationType(event.target.value);
    };
    const handleAssetChange = (event) => {
        setCurrentAssetId(event.target.value);
    };
    const handleTransferToAssetChange = (event) => {
        setTransferToAssetId(event.target.value);
    };
    const handleCategoryChange = (event) => {
        setCurrentCategory(event.target.value);
    };
    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };
    const handleRateChange = (event) => {
        setRate(event.target.value);
    };
    const handleSumChange = (event) => {
        setSum(event.target.value);
    };
    const handleCommentChange = (event) => {
        setComment(event.target.value);
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
            operationType === "incoming"
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

        setTitle("");
        setComment("");
        setSum(0);
    };

    return (
        <Box
            sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                spacing: 2
            }}
        >
            <Stack spacing = {1}
                   sx = {{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "center",
                       justifyContent: "center",
                       spacing: 1
                   }}
            >
                <ToggleButtons operationType = {operationType} handleOperationTypeChange = {handleOperationTypeChange}/>
                <AssetSelect currentAssetId = {currentAssetId} handleAssetChange = {handleAssetChange}
                             assets = {assets}/>

                {operationType !== "transfer" && (
                    <Autocomplete
                        disablePortal
                        id = "combo-box-demo"
                        sx = {{width: 300}}
                        options = {["food", "wear", "sport"]}
                        onChange = {handleCategoryChange}
                        freeSolo
                        renderInput = {(params) => <TextField {...params} label = "Category"/>}
                    />
                )}

                {operationType === "transfer" && (
                    <TransferFields
                        transferToAssets = {transferToAssets}
                        transferToAssetId = {transferToAssetId}
                        handleTransferToAssetChange = {handleTransferToAssetChange}
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
                    <AddButton buttonAddClicked = {buttonAddClicked}/>
                </>
            </Stack>
            <OperationsTable id = "shortOperations" operations = {operations}/>

        </Box>
    );
});
