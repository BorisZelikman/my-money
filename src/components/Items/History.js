import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import AuthStore from "../../Stores/AuthStore";
import {useCurrencies} from "../../hooks/useCurrencies";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import authStore from "../../Stores/AuthStore";
import {ToggleAccountsOrAssets} from "../UI/ToggleAccountsOrAssets";
import {useAccounts} from "../../hooks/useAccounts";
import {AccountSelect} from "../UI/AccountSelect";
import useMediaQuery from "@mui/material/useMediaQuery";
import {OperationsFilter} from "./OperationsFilter";
import {useUserPreference} from "../../hooks/useUserPreference";
import {getOperationsInInterval, getOperationsWithAssetsFields} from "../../data/dataFunctions";

export const History=({onProcess})=> {
    const [currentAccountId, setCurrentAccountId] = useState("");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const {accounts,getAccounts}=useAccounts();
//    const {currencies, getCurrencies} = useCurrencies();
    const {assets, getAssets} = useAssets();
    const {operations, setOperations, getAccountAssetOperations, getAllAssetsOperations} = useOperations();
    const {userPreference, getUserPreference, updateUserPreference}=useUserPreference();
    const [operationsBeforeFilter, setOperationsBeforeFilter] = useState([])
    const [filteredOperations, setFilteredOperations] = useState([])

    const [viewMode, setViewMode]= useState("Accounts")

    const navigate = useNavigate();

    const userId = AuthStore.currentUserID;
    const currencies= AuthStore.currencies;
    const userAccounts= AuthStore.userAccounts;
    const assetsSettings= AuthStore.userAssets;

    const assetById =(id)=> assets.find((a) => a.id === id);

    const [currentOperationId, setCurrentOperationId] =useState("");

    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");

    const [filter, setFilter] = useState({
        search: "",
        fromDate: new Date(new Date().setDate(new Date().getDate()-7)),
        toDate: new Date(new Date().setDate(new Date().getDate())),
        category: null,
        payments: true,
        incomes: true,
        credits: true
    });

    useEffect(() => {
        if (userId === null) {
            navigate(`/`);
        }
        else {
            onProcess(true)
            getAccounts(userAccounts);
            getAssets(userAccounts, assetsSettings);
            console.log("getAssets")
            onProcess(false)
        }
    }, []);

    useEffect(() => {
        if (userPreference===undefined || userPreference?.length===0) return
        setCurrentAccountId(userPreference.currentAccountId);
    }, [userPreference]);


    useEffect(() => {
        if (accounts.length === 0) return;
    }, [accounts]);

    useEffect(() => {
        if (assets.length === 0) return;
        getUserPreference(userId)
    }, [assets]);

    useEffect(() => {
        if (assets.length===0) return
        onProcess(true)
        getAllAssetsOperations(assets.filter(a=>a.accountId===currentAccountId), true).then(()=>{onProcess(false)});
    }, [currentAccountId]);

    useEffect(() => {
        if (operations.length===0) return;
        setOperationsBeforeFilter(getOperationsWithAssetsFields(assets,operations))
    }, [operations]);

    useEffect(() => {
        if (operationsBeforeFilter.length===0) return;

        let intervalOperations =getOperationsInInterval(operationsBeforeFilter,filter.fromDate, filter.toDate);
        if (filter.category!==null) intervalOperations = intervalOperations.filter((o) => o.category === filter.category);
        if (!filter.credits) intervalOperations = intervalOperations.filter((o) => o.category !== "credit");
        if (!filter.incomes) intervalOperations = intervalOperations.filter((o) => o.type !== "income" && o.category !== "transfer to");
        if (!filter.payments) intervalOperations = intervalOperations.filter((o) => o.type !== "payment" && o.category !== "transfer from");
        setFilteredOperations(intervalOperations)
    }, [operationsBeforeFilter, filter]);

    useEffect(() => {
        console.log(viewMode)
    }, [viewMode]);

    useEffect(() => {
    }, [currentOperationId]);

    useEffect(() => {
        if (currentAssetId !== "") {
//            getAssets(AuthStore.currentUserID);

                //getOperations(userId, currentAssetId);
                getAccountAssetOperations(assetById(currentAssetId)?.accountId, currentAssetId);
        }
    }, [currentAssetId]);

    const handleChangeViewMode=async (mode) =>{
        setViewMode(mode);
    }


    const handleAssetChange = (event) => {
        console.log("handleAssetChange event.target.value", event.target.value);
        if (event.target.value) {
            setCurrentAssetId(event.target.value);
        } else {
            setCurrentAssetId("All Assets");
        }
    };
    const handleAccountSelect = (accountId) => {
        setCurrentAccountId(accountId);
        updateUserPreference(userId, "currentAccountId", accountId);
    };

    const handleFilterChange =(filter)=>{
        setFilter(filter)
        setCurrentOperationId("-");
    }


    return (
        <Box className="page" >
            <Box className="title-box">
                <Typography variant = "h5">
                    History
                </Typography>
            </Box>
            <Box className="verticalContainer container90" >
                <ToggleAccountsOrAssets value={viewMode} onToggle={handleChangeViewMode}/>

                {viewMode==="Accounts" &&
                    <AccountSelect caption = "Select account"
                                   accounts = {accounts.filter(a=>a.switched)} currentAccountId={currentAccountId}
                                   onAccountSelect={handleAccountSelect}/>
                }
                {viewMode==="Assets" &&
                    <AssetSelect caption = "Select asset"
                                 assets = {assets} currentAssetId = {currentAssetId}
                                 handleAssetChange = {handleAssetChange} showAllAssets = {true}/>
                }
            </Box>
            <Box className="resultContainer" sx={{flex:1}}>
                < OperationsTable operations = {filteredOperations}
                                  currentOperationId={currentOperationId}
                                  currencies = {currencies}
                                  selectForEdit={true}
                                  showAssets={true}
                                  showCategories={true}
                                  showComments={true}
                                  onRowSelect={()=>{}}
                    />
            </Box>
            <Box className="resultContainer" >
                <OperationsFilter operations = {operationsBeforeFilter} filteredOperations={filteredOperations} onChange={handleFilterChange}/>
            </Box>
        </Box>
    );
}
