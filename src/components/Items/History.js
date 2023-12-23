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

export const History=({onProcess})=> {
    const [currentAccountId, setCurrentAccountId] = useState("");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const {accounts,getAccounts}=useAccounts();
//    const {currencies, getCurrencies} = useCurrencies();
    const {assets, getAssets} = useAssets();
    const {operations, setOperations, getAccountAssetOperations, getAllAssetsOperations} = useOperations();

    const [viewMode, setViewMode]= useState("Accounts")

    const navigate = useNavigate();

    const userId = AuthStore.currentUserID;
    const currencies= AuthStore.currencies;
    const userAccounts= AuthStore.userAccounts;
    const assetsSettings= AuthStore.userAssets;

    const assetById =(id)=> assets.find((a) => a.id === id);

    const [tableHeight, setTableHeight] =useState(0);

    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");
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
        const usedHeight= 210
        const updateTableHeight = () => {
            //setTableHeight(window.innerHeight - usedHeight);
            setTableHeight(boxRef.current.offsetHeight - usedHeight);
        };

        // Add event listener for window resize
        window.addEventListener('resize', updateTableHeight);

        // Set initial table height
        //setTableHeight(boxRef.current.offsetHeight- usedHeight);
        setTableHeight(boxRef.current.offsetHeight - usedHeight);

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('resize', updateTableHeight);
        };
    });
    useEffect(() => {
        if (accounts.length === 0) return;
        console.table (accounts)
    }, [accounts]);

    useEffect(() => {
        if (assets.length === 0) return;
        console.table (assets)
    }, [assets]);

    useEffect(() => {
        if (assets.length===0) return
        onProcess(true)
        getAllAssetsOperations(assets.filter(a=>a.accountId===currentAccountId), true).then(()=>{onProcess(false)});

    }, [currentAccountId]);
    useEffect(() => {
        if (operations.length===0) return;
        console.table(operations)
    }, [operations]);

    useEffect(() => {
        console.log(viewMode)
    }, [viewMode]);

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
    };

    console.log ("height:", window.innerHeight)
    const boxRef = useRef(null);

    useEffect(() => {
        // Check if the ref is defined
        if (boxRef.current) {
            const boxHeight = boxRef.current.offsetHeight;
            console.log("Box Height:", boxHeight);
        }
    }, []); // The empty dependency array ensures that the effect runs only once on component mount

    const handleFilterChange =(filter)=>{
        setFilter(filter)
    }

    const [filter, setFilter] = useState({
        search:"",
        payments:true,
        incomes:true,
        credits:false
    });
    useEffect(() => {
    }, [filter]);
    return (
        <Box className="page" ref={boxRef}>
            <Box className="title-box">
                <Typography variant = "h5">
                    History
                </Typography>
            </Box>
            <Box className="verticalContainer container90">
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
            <Box className="resultContainer" sx = {{minHeight: tableHeight, flex:1}}>
                {/*<Box sx = {{*/}
                {/*    display: "flex",*/}
                {/*    flexDirection: "column",*/}
                {/*    alignItems: "center",*/}
                {/*    width: "90%",*/}
                {/*    overflowY: "auto",*/}
                {/*    pb: 1,*/}
                {/*    backgroundColor:"blue"*/}
                {/*}}>*/}
                    < OperationsTable assets = {assets} operations = {operations}
                                      filter = {filter} currencies = {currencies}/>
                </Box>
            {/*</Box>*/}
            <OperationsFilter  onChange={handleFilterChange}/>

        </Box>
    );
}
