import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import {AssetSelect} from "../UI/AssetSelect";
import {InputFields} from "../UI/InputFields";
import {AddButton} from "../UI/AddButton";
import {TransferFields} from "../UI/TransferFields";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Grid} from "@mui/material";
import {ToggleButtons} from "../UI/ToggleButtons";
import {getCurrencySymbolOfAsset} from "../../data/currencyMethods";

export const OperationEditor = ({operationData,
                                handleOperationTypeChange,
                                    handleAssetChange,handleCreditFromAssetChange,handleTransferToAssetChange,
                                    handleCategoryChange,handleRateChange,
                                    handleTitleChange, handleSumChange, handleCommentChange, buttonAddClicked
                                }) => {
    const {
        operationType,
        assets, currentAssetId, creditAssets, creditAssetId, transferToAssets, transferToAssetId,
        currentCategory, rate, title, sum, comment, date,
        isCreditNeeded, rateCaption, isButtonDisabled,
        currencies
    }=operationData;


    const isSmallWidthScreen = useMediaQuery("(max-width: 450px)");
    const allowTwoColumn = !isSmallWidthScreen && operationType === "transfer";

    console.log(operationData, operationType, operationData.operationType)

    return (
        <Stack className="verticalContainer container90" >
            <ToggleButtons operationType = {operationType} handleOperationTypeChange = {handleOperationTypeChange}/>
            {allowTwoColumn ? (
                <Grid container>
                    <Grid item xs = {isCreditNeeded?4:6} sx = {{pr: 1}}>
                        <AssetSelect caption = "From" assets = {assets} currentAssetId = {currentAssetId}
                                     handleAssetChange = {handleAssetChange}/>
                    </Grid>
                    {isCreditNeeded ?
                        <Grid item xs = {4} sx = {{pr: 1}}>
                            <AssetSelect caption = "Credit from"
                                         assets = {creditAssets} currentAssetId={creditAssetId}
                                         handleAssetChange = {handleCreditFromAssetChange}/>
                        </Grid> : null
                    }
                    <Grid item xs = {isCreditNeeded?4:6}>
                        <AssetSelect caption = "To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                     handleAssetChange = {handleTransferToAssetChange}/>
                    </Grid>
                </Grid>) : (
                    <>
                        <Grid container>
                            <Grid item xs = {isCreditNeeded?6:12} sx = {{pr: isCreditNeeded?1:0}}>
                                <AssetSelect caption = "From" assets = {assets} currentAssetId = {currentAssetId}
                                             handleAssetChange = {handleAssetChange}/>
                            </Grid>
                            {isCreditNeeded ? (
                            <Grid item xs = {6}>
                                <AssetSelect caption = "Credit from"
                                             assets = {creditAssets} currentAssetId={creditAssetId}
                                             handleAssetChange = {handleCreditFromAssetChange}/>
                            </Grid>) : null}
                        </Grid>
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
    );
};
