import React, {useEffect, useState} from "react";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import {useActives} from "../hooks/useActives";
import {useOperations} from "../hooks/useOperations";
import {useUserPreference} from "../hooks/useUserPreference";
import OperationsList from "../components/Items/OperationsList";
import Stack from "@mui/material/Stack";

export const Operations = () => {
    const [user, setUser] = useState(null);

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
    const {actives, getActives, updateActiveField} = useActives();
    const {operations, getOperations, addOperation} = useOperations();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (user) {git
            getActives(user.uid);
            getUserPreference(user.uid);
            if (user && currentActiveId) {
                getOperations(user.uid, currentActiveId);
            }
        }
    }, [user]);

    useEffect(() => {
        if (userPreference) {
            setCurrentActiveId(userPreference.currentActiveId);
            setOperationType(userPreference.operationType);
            if (user && currentActiveId) {
                getOperations(user.uid, currentActiveId);
            }
        }
    }, [userPreference]);

    useEffect(() => {
        if (actives) {
            setTransferToActives(actives.filter((a) => a.id !== currentActiveId));
        }
    }, [currentActiveId]);

    useEffect(() => {
        if (user && currentActiveId) {
            getOperations(user.uid, currentActiveId);
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
            user.uid,
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

        updateActiveField(
            user.uid,
            currentActiveId,
            "amount",
            operationType === "incoming"
                ? activeAmount + Number(sum)
                : activeAmount - Number(sum)
        );

        if (operationType === "transfer") {
            addOperation(
                user.uid,
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

            updateActiveField(
                user.uid,
                transferToActiveId,
                "amount",
                activeAmount + Number(sum * rate)
            );
        }
        updateUserPreference(user.uid, "currentActiveId", currentActiveId);
        updateUserPreference(user.uid, "transferToActiveId", transferToActiveId);
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
                spacing: 2
            }}
        >
            <Stack spacing = {3}>

                <ToggleButtonGroup
                    color = "primary"
                    value = {operationType}
                    exclusive
                    onChange = {handleOperationTypeChange}
                    aria-label = "Platform"
                >
                    <ToggleButton value = "payment">Payment</ToggleButton>
                    <ToggleButton value = "incoming">Incoming</ToggleButton>
                    <ToggleButton value = "transfer">Transfer</ToggleButton>
                </ToggleButtonGroup>
                <Select
                    onChange = {handleActiveChange}
                    sx = {{
                        marginTop: 2,
                        width: 300
                    }}
                    value = {currentActiveId}
                >
                    {actives.map((a) => (
                        <MenuItem value = {a.id}>
                            {a.title} ({a.amount} {a.currency})
                        </MenuItem>
                    ))}
                </Select>
                {operationType === "transfer" ? null : (
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
                {operationType === "transfer" ? (
                    <>
                        <Select
                            onChange = {handleTransferToActiveChange}
                            sx = {{
                                width: 300
                            }}
                            value = {transferToActiveId}
                        >
                            {transferToActives.map((a) => (
                                <MenuItem value = {a.id}>
                                    {a.title} ({a.amount} {a.currency})
                                </MenuItem>
                            ))}
                        </Select>
                        <div style = {{width: 300, display: "flex", alignItems: "center"}}>
                            <Typography variant = "p" gutterBottom style = {{width: "70%"}}>
                                Transfer rate
                            </Typography>
                            <TextField
                                style = {{width: "30%"}}
                                label = "Rate"
                                type = "number"
                                value = {rate}
                                onChange = {handleRateChange}
                            />
                        </div>
                    </>
                ) : null}
                <div style = {{width: 300, display: "flex", alignItems: "center"}}>
                    <TextField
                        style = {{width: "70%"}}
                        label = "Title"
                        value = {title}
                        onChange = {handleTitleChange}
                    />
                    <TextField
                        style = {{width: "30%"}}
                        label = "Sum"
                        type = "number"
                        value = {sum}
                        onChange = {handleSumChange}
                    />
                </div>
                <TextField
                    style = {{width: 300}}
                    label = "Comment"
                    value = {comment}
                    onChange = {handleCommentChange}
                />
                <Button
                    variant = "contained"
                    size = "large"
                    style = {{width: 300, marginTop: 10}}
                    onClick = {() => buttonAddClicked()}
                >
                    Add
                </Button>
                <OperationsList operations = {operations}/>
            </Stack>
        </Box>
    );
};
