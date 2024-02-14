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
import {getOperationsInInterval, getOperationsSum, getOperationsWithAssetsFields} from "../../data/dataFunctions";
import {useMutuals} from "../../hooks/useMutuals";
import {TogglePurpose} from "../UI/TogglePurpose";

export const History = ({onProcess}) => {
    const [currentAccountId, setCurrentAccountId] = useState("");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const {accounts, getAccounts} = useAccounts();
//    const {currencies, getCurrencies} = useCurrencies();
    const {assets, getAssets} = useAssets();
    const {operations, setOperations, getAccountAssetOperations, getAllAssetsOperations} = useOperations();
    const {userPreference, getUserPreference, updateUserPreference} = useUserPreference();
    const {mutualOperations, purposes, participants, getPurposes, getMutualOperations, getParticipants} = useMutuals()
    const [operationsBeforeFilter, setOperationsBeforeFilter] = useState([])
    const [filteredOperations, setFilteredOperations] = useState([])

    const [userAccountId, setUserAccountId] = useState(null)
    const [userRate, setUserRate] = useState(null)


    const [viewMode, setViewMode] = useState("Assets")

    const navigate = useNavigate();

    const userId = AuthStore.currentUserID;
    const currencies = AuthStore.currencies;
    const userAccounts = AuthStore.userAccounts;
    const assetsSettings = AuthStore.userAssets;

    const assetById = (id) => assets.find((a) => a.id === id);

    const [currentOperationId, setCurrentOperationId] = useState("");

    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");

    const [checkedPurposes, setCheckedPurposes] = useState(["2w7VYmIiuLMHC5GnpOzh", "iPix9r72BjOu4F9O71O5"])

    function getFirstDayOfCurrentMonth() {
        const currentDate = new Date();
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);

        return currentDate;
    }

    const [filter, setFilter] = useState({
        search: "",
        start: getFirstDayOfCurrentMonth(),
        end: new Date(),
        category: null,
        payments: true,
        incomes: true,
        credits: true,
        common:true,
        // checkedPurposes: ["2w7VYmIiuLMHC5GnpOzh", "iPix9r72BjOu4F9O71O5"]
    });

    useEffect(() => {
        if (userId === null) {
            navigate(`/`);
        } else {
            onProcess(true)
            getAccounts(userAccounts);
            getAssets(userAccounts, assetsSettings);
            console.log("getAssets")
            onProcess(false)
        }
    }, []);

    useEffect(() => {
        if (userPreference.length === 0) return

        if (userPreference.mutuals?.length > 0) {
            getPurposes(userPreference.mutuals[0])
            getMutualOperations(userPreference.mutuals[0])
            getParticipants(userPreference.mutuals[0])
        }
    }, [userPreference]);

    useEffect(() => {
        if (purposes?.length > 0) setFilter({...filter, checkedPurposes: purposes.map(obj=>obj['id'])});
    }, [purposes]);

    useEffect(() => {
        console.log(filter?.checkedPurposes)
    }, [filter]);

    useEffect(() => {
        if (!participants || !userPreference) return;

        for (const participant of participants) {
            const found = userPreference.accounts.find((e) => e.id === participant.accountId);
            if (found) {
                setUserAccountId(participant.accountId)
                setUserRate(participant.rate)
            }
        }

    }, [participants, userPreference]);


    useEffect(() => {
        if (accounts.length === 0) return;
    }, [accounts]);

    useEffect(() => {
        if (assets.length === 0) return;
        getUserPreference(userId)
    }, [assets]);

    useEffect(() => {
        if (assets.length === 0) return
        onProcess(true)
        getAllAssetsOperations(assets.filter(a => a.accountId === currentAccountId), true).then(() => {
            onProcess(false)
        });
    }, [currentAccountId]);

    useEffect(() => {
        if (operations.length === 0) return;
        setOperationsBeforeFilter(getOperationsWithAssetsFields(assets, operations))
    }, [operations]);

    useEffect(() => {
        if (operationsBeforeFilter?.length === 0) return;

        let intervalOperations = getOperationsInInterval(operationsBeforeFilter, filter?.start, filter?.end);
        if (filter.category !== null) intervalOperations = intervalOperations.filter((o) => o.category === filter.category);
        if (!filter.credits) intervalOperations = intervalOperations.filter((o) => o.category !== "credit");
        if (!filter.incomes) intervalOperations = intervalOperations.filter((o) => o.type !== "income" && o.category !== "transfer to");
        if (!filter.common) intervalOperations = intervalOperations.filter((o) => !o.purposeId || o.purposeId==="");
        if (!filter.payments) intervalOperations = intervalOperations.filter((o) => o.type !== "payment" && o.category !== "transfer from");
        if (viewMode==="Common") intervalOperations = intervalOperations.filter(o => filter?.checkedPurposes.indexOf(o.purposeId) !== -1);
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

    const handleChangeViewMode = async (mode) => {
        setViewMode(mode);
        if (mode === "Common") setOperationsBeforeFilter(getOperationsWithAssetsFields(assets, mutualOperations))
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

    const handleFilterChange = (filter) => {
        setFilter(filter)
        setCurrentOperationId("-");
    }

    const handlePurposeChange = (purposeId) => {
        if (!purposeId) return;
        const index = filter?.checkedPurposes.indexOf(purposeId);

        if (index !== -1) {
            if (filter.checkedPurposes?.length > 1) {
                const newArray = filter.checkedPurposes.filter(item => item !== purposeId);
                setFilter({...filter, checkedPurposes: newArray})
            //    setCheckedPurposes(newArray);
            }
        } else {
            const newCheckedPurposes = [...filter.checkedPurposes, purposeId];
            setFilter({ ...filter, checkedPurposes: newCheckedPurposes });
        }

    }


    return (
        <Box className="page">
            <Box className="title-box">
                <Typography variant="h5">
                    History
                </Typography>
            </Box>
            <Box className="verticalContainer container90">
                <ToggleAccountsOrAssets value={viewMode} onToggle={handleChangeViewMode}/>

                {viewMode === "Accounts" &&
                    <AccountSelect caption="Select account"
                                   accounts={accounts.filter(a => a.switched)} currentAccountId={currentAccountId}
                                   onAccountSelect={handleAccountSelect}/>
                }
                {viewMode === "Assets" &&
                    <AssetSelect caption="Select asset"
                                 assets={assets} currentAssetId={currentAssetId}
                                 onAssetChange={handleAssetChange} showAllAssets={false}/>
                }
            </Box>
            <Box className="resultContainer" sx={{flex: 1}}>
                < OperationsTable operations={filteredOperations}
                                  currentOperationId={currentOperationId}
                                  currencies={currencies}
                                  selectForEdit={true}
                                  showAssets={true}
                                  showCategories={true}
                                  showComments={true}
                                  onRowSelect={() => {
                                  }}
                />
            </Box>
            <Box className="resultContainer">
                <OperationsFilter operations={operationsBeforeFilter} filteredOperations={filteredOperations}
                                  filter={filter} viewMode={viewMode}
                                  participantData={{rate:userRate, accountId:userAccountId}}
                                  onPurposeChange={handlePurposeChange}
                                  purposes={purposes} checkedPurposes={checkedPurposes}
                                  onChange={handleFilterChange}/>
            </Box>
        </Box>
    );
}
