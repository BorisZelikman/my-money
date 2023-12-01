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
import {getCurrencyOfAsset, getCurrencySymbolOfAsset} from "../../data/currencyMethods";
import {CrudToolbar} from "./CrudToolbar";

export const OperationEditor = ({ changingMode, operationData,
                                    onOperationTypeChange,
                                    onAssetChange, onCreditFromAssetChange, onTransferToAssetChange,
                                    onCategoryChange,onRateChange,
                                    onTitleChange, onSumChange, onCommentChange, onDateChange,
                                    onCancelClick,
                                    buttonAddClicked
                                }) => {
    const {
        operationType,
        assets, currentAssetId, creditAssets, creditAssetId, transferToAssets, transferToAssetId,
        currentCategory, rate, title, sum, comment, date,
        isCreditNeeded, rateCaption, isButtonDisabled,
        currencies
    }=operationData;



    const fromAssetCurrency = getCurrencyOfAsset(assets, currentAssetId);
    const toAssetCurrency = getCurrencyOfAsset(assets, transferToAssetId);
    const sameCurrencyTransfer=fromAssetCurrency===toAssetCurrency;


    const isSmallWidthScreen = useMediaQuery("(max-width: 450px)");
    const allowTwoColumn = !isSmallWidthScreen && operationType === "transfer";

    return (
        <Stack className="verticalContainer container90" >
            <ToggleButtons operationType = {operationType} onOperationTypeChange = {onOperationTypeChange}/>
            {allowTwoColumn ? (
                <Grid container>
                    <Grid item xs = {isCreditNeeded?4:6} sx = {{pr: 1}}>
                        <AssetSelect caption = "From" assets = {assets} currentAssetId = {currentAssetId}
                                     onAssetChange = {onAssetChange}/>
                    </Grid>
                    {isCreditNeeded ?
                        <Grid item xs = {4} sx = {{pr: 1}}>
                            <AssetSelect caption = "Credit from"
                                         assets = {creditAssets} currentAssetId={creditAssetId}
                                         onAssetChange = {onCreditFromAssetChange}/>
                        </Grid> : null
                    }
                    <Grid item xs = {isCreditNeeded?4:6}>
                        <AssetSelect caption = "To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                     onAssetChange = {onTransferToAssetChange}/>
                    </Grid>
                </Grid>) : (
                    <>
                        <Grid container>
                            <Grid item xs = {isCreditNeeded?6:12} sx = {{pr: isCreditNeeded?1:0}}>
                                <AssetSelect caption = "From" assets = {assets} currentAssetId = {currentAssetId}
                                             onAssetChange = {onAssetChange}/>
                            </Grid>
                            {isCreditNeeded ? (
                            <Grid item xs = {6}>
                                <AssetSelect caption = "Credit from"
                                             assets = {creditAssets} currentAssetId={creditAssetId}
                                             onAssetChange = {onCreditFromAssetChange}/>
                            </Grid>) : null}
                        </Grid>
                        {operationType === "transfer" ? (
                            <AssetSelect caption = "To" assets = {transferToAssets} currentAssetId = {transferToAssetId}
                                         onAssetChange = {onTransferToAssetChange}/>
                        ) : null}
                    </>
                )}
                {operationType !== "transfer" && (
                    <TextField className="input-field" fullWidth
                               size="small"
                        label = "Category"
                        value = {currentCategory}
                        onChange = {onCategoryChange}
                    />
                )}

            {operationType === "transfer" && !sameCurrencyTransfer &&(
                <TransferFields
                    rateCaption = {rateCaption}
                    rate = {rate}
                    onRateChange = {onRateChange}
                />
            )}

            <InputFields
                title = {title}
                sum = {sum}
                comment = {comment}
                date = {date}
                currencySymbol = {getCurrencySymbolOfAsset(assets, currentAssetId, currencies)}
                onTitleChange = {onTitleChange}
                onSumChange = {onSumChange}
                onCommentChange = {onCommentChange}
                onDateChange={onDateChange}
            />

            {changingMode ?
                <CrudToolbar onCancelClick={onCancelClick}/> :
                <AddButton disabled = {isButtonDisabled} buttonAddClicked = {buttonAddClicked}/>
            }
        </Stack>
    );
};
