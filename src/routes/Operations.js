import {useEffect, useState} from "react";
import {auth} from "../config/firebase";
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
import {useParams} from "react-router-dom";
import {OperationsTable} from "../components/Items/OperationsTable";

export const Operations = () => {
    const {userId} = useParams();

    const [operationType, setOperationType] = useState("payment");
    const [currentActiveId, setCurrentActiveId] = useState("");
    const [transferToActives, setTransferToActives] = useState("");
    const [transferToActiveId, setTransferToActiveId] = useState("");
    const [rate, setRate] = useState(1);
    const [currentCategory, setCurrentCategory] = useState("");
    const [title, setTitle] = useState("");
    const [sum, setSum] = useState(0);
    const [comment, setComment] = useState("");

    const {userPreference, getUserPreference, updateUserPreference} =
        useUserPreference();
    const {actives, getAssets, updateAssetField} = useAssets();
    const {operations, getOperations, addOperation} = useOperations();

    useEffect(() => {
            getAssets(userId);
            getUserPreference(userId);
            if (currentActiveId) {
                getOperations(userId, currentActiveId);
            }
    }, []);

    useEffect(() => {
        if (userPreference) {
            setCurrentActiveId(userPreference.currentActiveId);
            setOperationType(userPreference.operationType);
            if (currentActiveId) {
                getOperations(userId, currentActiveId);
            }
        }
    }, [userPreference]);

    useEffect(() => {
        if (actives) {
            setTransferToActives(actives.filter((a) => a.id !== currentActiveId));
        }
    }, [currentActiveId]);

    useEffect(() => {
        if (currentActiveId) {
            getOperations(userId, currentActiveId);
        }
    }, [currentActiveId]);

    const handleOperationTypeChange = (event, newType) => {
        setOperationType(event.target.value);
    };
    const handleActiveChange = (event) => {
        setCurrentActiveId(event.target.value);
    };
    const handleTransferToActiveChange = (event) => {
        setTransferToActiveId(event.target.value);
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
            userId,
            currentActiveId,
            operationType,
            title,
            sum,
            operationType === "transfer" ? "transfer from" : currentCategory,
            comment,
            new Date()
        );

        let activeAmount = actives.filter((a) => a.id === currentActiveId)[0]
            .amount;

        updateAssetField(
            userId,
            currentActiveId,
            "amount",
            operationType === "incoming"
                ? activeAmount + Number(sum)
                : activeAmount - Number(sum)
        );

        if (operationType === "transfer") {
            addOperation(
                userId,
                transferToActiveId,
                operationType,
                title,
                sum * rate,
                "transfer to",
                comment,
                new Date()
            );
            activeAmount = actives.filter((a) => a.id === transferToActiveId)[0]
                .amount;

            updateAssetField(
                userId,
                transferToActiveId,
                "amount",
                activeAmount + Number(sum * rate)
            );
        }
        updateUserPreference(userId, "currentActiveId", currentActiveId);
        updateUserPreference(userId, "transferToActiveId", transferToActiveId);
        updateUserPreference(userId, "operationType", operationType);

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
                <AssetSelect currentActiveId = {currentActiveId} handleActiveChange = {handleActiveChange}
                             actives = {actives}/>

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
                        transferToActives = {transferToActives}
                        transferToActiveId = {transferToActiveId}
                        handleTransferToActiveChange = {handleTransferToActiveChange}
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
            <OperationsTable id="shortOperations" operations={operations} />

        </Box>
    );
};
