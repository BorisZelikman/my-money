import {useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";
import useMediaQuery from "@mui/material/useMediaQuery";
import {calcTotalForCurrency, getCurrencySymbol} from "../../data/currencyMethods";
import authStore from "../../Stores/AuthStore";
import {CurrencySelector} from "./CurrencySelector";
import {Grid} from "@mui/material";
import {getExchangeRates} from "../../data/exchangeMethods";
import { DragDropContext, Droppable, Draggable  } from 'react-beautiful-dnd';
import {useUserPreference} from "../../hooks/useUserPreference";
import {useAccounts} from "../../hooks/useAccounts";
import {Account} from "./Account";

export const AssetsTotal = ({assets, exchangeRates, hideSymbol}) => {
    useEffect(() => {
    }, [assets, exchangeRates]);



    return (
        <Typography align = "center" variant = "subtitle1">
            {calcTotalForCurrency(assets, exchangeRates)} {
                hideSymbol?null:getCurrencySymbol(AuthStore.currencies, AuthStore.userMainCurrency)}
        </Typography>
    );
};
