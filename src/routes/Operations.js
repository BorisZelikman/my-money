import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {useAssets} from "../hooks/useAssets";
import {useOperations} from "../hooks/useOperations";
import {useUserPreference} from "../hooks/useUserPreference";
import {OperationsTable} from "../components/Items/OperationsTable";
import AuthStore from "../Stores/AuthStore";
import {observer} from "mobx-react";
import {getCurrencyOfAsset,  getExchangeRate} from "../data/currencyMethods";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import {useAccounts} from "../hooks/useAccounts";
import {OperationEditor} from "../components/Items/OperationEditor";
import {format} from "date-fns";
import authStore from "../Stores/AuthStore";
import {getCategoriesOfOperations, getOperationsWithAssetsFields, getTitlesOfOperations} from "../data/dataFunctions";
import Button from "@mui/material/Button";
import {get} from "mobx";
import {useMutuals} from "../hooks/useMutuals";

export const Operations = observer(({onProcess}) => {
    const [operationType, setOperationType] = useState("payment");

    const [currentAccountId, setCurrentAccountId] = useState("");
    const [currentAssetId, setCurrentAssetId] = useState("");
    const [currentOperationId,  setCurrentOperationId ] = useState("");
    const [currentPurposeId,  setCurrentPurposeId ] = useState("");


    const [transferToAssets, setTransferToAssets] = useState("");
    const [transferToAssetId, setTransferToAssetId] = useState("");

    const [isCreditNeeded, setIsCreditNeeded] = useState(false);
    const [creditAssets, setCreditAssets] = useState("");
    const [creditAssetId, setCreditAssetId] = useState("");
    const [creditSum, setCreditSum] = useState(0);

    const [rate, setRate] = useState(1);
    const [rateCaption, setRateCaption] = useState("Transfer rate");
    const [currentCategory, setCurrentCategory] = useState("");
    const [title, setTitle] = useState("");
    const [sum, setSum] = useState(0);
    const [date, setDate] = useState("");
    const [comment, setComment] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const {userPreference, getUserPreference, updateUserPreference} = useUserPreference();
    const {accounts, getAccounts, addAccount} = useAccounts();
    const {assets, getAssets, updateAccountAssetField, addAccountAsset} = useAssets();
    const {operations, getAccountAssetOperations, deleteOperation,
        getAccountAssetOperation, updateOperationField, addAccountAssetOperation} = useOperations();
    const {purposes,getPurposes}=useMutuals()
    const [filteredOperations, setFilteredOperations] = useState([])

    const [changingMode, setChangingMode] = useState(false)

    const [tableHeight, setTableHeight] =useState(0);

    useEffect(() => {}, [changingMode]);

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
            onProcess(true)
            getUserPreference(userId)
        }
    }, []);

    useEffect(()=>{
        if (userPreference===undefined || userPreference?.length===0) return
        if (userPreference.currentAssetId) setCurrentAssetId(userPreference.currentAssetId);
        if (userPreference.creditAssetId) setCreditAssetId(userPreference.creditAssetId);
        if (userPreference.operationType) setOperationType(userPreference.operationType);
        getAssets(userPreference.accounts, userPreference.assets);
        if (userPreference.mutuals?.length>0) {
            getPurposes(userPreference.mutuals[0])
            console.log("currentPurpose",userPreference.currentPurpose)
        }
        if (userPreference.currentPurpose)setCurrentPurposeId(userPreference.currentPurpose)

        if (AuthStore.selectedAssetId) setCurrentAssetId(AuthStore.selectedAssetId);
    },[userPreference])

    useEffect(() => {
        console.log("currentPurposeId:", currentPurposeId)
    }, [currentPurposeId]);
    useEffect(() => {
      console.log("purposes",purposes)
    }, [purposes]);

    useEffect(() => {
        if (currentAssetId && assets?.length>0) {
            setCurrentAccountId(assetById(currentAssetId)?.accountId)
            // setIsCreditNeeded(operationType!=="income" &&
            //     assetById(currentAssetId)?.amount<=creditSum)
            getAccountAssetOperations(assetById(currentAssetId)?.accountId, currentAssetId);

        }
    }, [currentAssetId, assets]);

    useEffect(() => {
        if (!currentAccountId) return;
        // in list of transferTo shouldn't be currentAssetId
        if (assets) {
            setTransferToAssets(assets.filter((a) => a.id !== currentAssetId));
            setCreditAssets(assets.filter((a) => a.id !== currentAssetId && a.amount>creditSum))
        }
//        getAccountAssetOperations(currentAccountId, currentAssetId);
    }, [currentAccountId]);

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

    useEffect( () => {
        if (assets.length===0 || operations.length===0) return;

        let sortedOperations = getOperationsWithAssetsFields(assets,operations);
        //sortedOperations = sortedOperations.filter((o) => o.category !== "-credit");
        setFilteredOperations(sortedOperations)
        onProcess(false)
        if (AuthStore.selectedOperationId) handleEditOperation(AuthStore.selectedOperationId);
    }, [operations, assets]);

    useEffect(() => {
        console.table(filteredOperations)
    }, [filteredOperations]);

    useEffect(() => {
        if (creditAssets.length>0 && creditAssets.some(a=>a.id===creditAssetId)===false){
            setCreditAssetId("");
        }
    }, [creditAssets]);

    useEffect(() => {
        validateForm(title, sum, currentAssetId, transferToAssetId, creditAssetId);
    }, [creditAssetId, isCreditNeeded]);

    useEffect(() => {

    }, [isButtonDisabled]);

    const handleOperationTypeChange = (event, newType) => {
        setOperationType(event.target.value);
        validateForm(title, sum,  currentAssetId,transferToAssetId, creditAssetId);
    };
    const handleAssetChange = async(event) => {
        await setCurrentAssetId(event.target.value);
        validateForm(title, sum,  event.target.value,transferToAssetId, creditAssetId);
    };
    const handlePurposeChange= async(purposeId) =>{
        console.log("purposeChange:",purposeId)
        if (purposeId===undefined) return;
        setCurrentPurposeId(currentPurposeId===purposeId?"":purposeId)

        updateUserPreference(userId, "currentPurpose",
            userPreference.currentPurpose===purposeId?"":purposeId);

    };
    const handleTransferToAssetChange = (event) => {
        setTransferToAssetId(event.target.value);
        validateForm(title, sum, currentAssetId, event.target.value, creditAssetId);
    };
    const handleCreditFromAssetChange = (event) => {
        setCreditAssetId(event.target.value);
        validateForm(title, sum, currentAssetId, transferToAssetId, event.target.value);
    };
    const handleCategoryChange = (value) => {
        setCurrentCategory(value);
    };
    const handleTitleChange = (value) => {
        setTitle(value||"");
        validateForm(value||"", sum, currentAssetId, transferToAssetId, creditAssetId);
        if (value) {
            const sameTitleOperation=filteredOperations.find((o) => o.title ===value);
            if (sameTitleOperation!==undefined) setCurrentCategory(sameTitleOperation.category);
        }
    };
    const handleRateChange = (event) => {
        setRate(event.target.value);
    };
    const handleSumChange = (event) => {
        let s=event.target.value;

        setSum(s);
        validateForm(title, event.target.value, currentAssetId, transferToAssetId, creditAssetId);
    };
    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const handleDateChange = (date) => {
        setDate(date);
    };

    // enable buttonAdd only if all required fields are filled

    const validateForm = (title, sum, assetId, transferToId, creditAssetId) => {

        let ok = title.trim() !== "" && sum > 0 && assetId !== "";

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
        /*
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
*/
    }
    const allowTwoColumn = !isSmallWidthScreen && operationType === "transfer";

    const operationDataForEditor = {
        operationType: operationType,
        assets: assets.filter((asset) =>
                userPreference.assets.some((userAsset) => userAsset.id === asset.id && !userAsset.hide )),
        currentAssetId: currentAssetId,
        creditAssets: creditAssets,
        creditAssetId: creditAssetId,
        transferToAssets: transferToAssets,
        transferToAssetId: transferToAssetId,
        currentCategory: currentCategory,
        rate: rate,
        title: title,
        sum: sum,
        comment: comment,
        date: date,

        isCreditNeeded: isCreditNeeded,
        rateCaption: rateCaption,
        isButtonDisabled: isButtonDisabled,

        currencies: currencies
    };

    let oldSum=0;

    const handleAddOperation = async () => {
        let operationIdOfCreditAsset="";
        let operationIdOfTransferToAsset="";

        const operationIdOfCurrentAsset= await addAccountAssetOperation(
            currentAccountId,
            currentAssetId,
            operationType,
            title,
            sum,
            operationType === "transfer" ? "transfer from" : currentCategory,
            comment,
            new Date(),
            userId,
            userPreference.currentPurpose
        );

        let assetAmount = assetById(currentAssetId).amount + Number(sum) * (operationType === "income" ? 1 : -1);


        await updateAccountAssetField(
            currentAccountId,
            currentAssetId,
            "amount",
            assetAmount
        );
        //--------- credit copy
        // if (isCreditNeeded) {
        //
        //     operationIdOfCreditAsset= await addAccountAssetOperation(
        //         assetById(creditAssetId).accountId,
        //         creditAssetId,
        //         operationType,
        //         title,
        //         creditSum,
        //         operationType === "transfer" ? "credit return" : "credit",
        //         comment,
        //         new Date(),
        //         userId
        //     );
        //
        //     assetAmount = assetById(creditAssetId).amount;
        //     await updateAccountAssetField(
        //         assetById(creditAssetId).accountId,
        //         creditAssetId,
        //         "amount",
        //         operationType === "transfer"
        //             ? assetAmount + Number(creditSum)
        //             : assetAmount - Number(creditSum)            );
        // }

        //---------
        if (operationType === "transfer") {
            operationIdOfTransferToAsset= await addAccountAssetOperation(
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
            await updateAccountAssetField(
                assetById(transferToAssetId).accountId,
                transferToAssetId,
                "amount",
                assetAmount + Number(sum * rate)
            );

        }
        // adding info about all changed assets in complex operation
        // if (isCreditNeeded||operationType === "transfer") {
        //     if (isCreditNeeded) {
        //         updateOperationField(currentAccountId, currentAssetId, operationIdOfCurrentAsset,
        //             "creditOperation", {assetId: creditAssetId, operationId: operationIdOfCreditAsset});
        //         updateOperationField(assetById(creditAssetId).accountId, creditAssetId, operationIdOfCreditAsset,
        //             "editOperation", {assetId: currentAssetId, operationId: operationIdOfCurrentAsset});
        //     }
        //     if (operationType === "transfer") {
        //         updateOperationField(currentAccountId, currentAssetId, operationIdOfCurrentAsset,
        //             "transferToOperation", {assetId: transferToAssetId, operationId: operationIdOfTransferToAsset});
        //         updateOperationField(assetById(transferToAssetId).accountId, transferToAssetId, operationIdOfTransferToAsset,
        //             "editOperation", {assetId: currentAssetId, operationId: operationIdOfCurrentAsset});
        //     }
        // }
        updateUserPreference(userId, "currentAssetId", currentAssetId);
        updateUserPreference(userId, "transferToAssetId", transferToAssetId);
//        updateUserPreference(userId, "creditAssetId", creditAssetId);

        updateUserPreference(userId, "operationType", operationType);
        validateForm("", 0, currentAssetId, transferToAssetId);
        setTitle("");
        setComment("");

        setSum(0);
        getAssets(userPreference.accounts, userPreference.assets);
        getAccountAssetOperations(currentAccountId,currentAssetId)

    };

    const handleEditOperation=async (operationId)=>{
        const operationToEdit=operations.find(operation => operation.id===operationId)
        if (operationToEdit) {
            setChangingMode(true);
            setCurrentOperationId(operationId)
        }

        setOperationType(operationToEdit.type);
        await setCurrentAssetId(operationToEdit.assetId)
        await setCurrentCategory(operationToEdit.category)
        await setTitle(operationToEdit.title)
        await setSum(operationToEdit.amount)
        await setComment(operationToEdit.comment)
        const dateString=format(new Date(operationToEdit.datetime.seconds*1000), 'yyyy-MM-dd');
        setCurrentPurposeId(operationToEdit.purposeId||"")

        await setDate(dateString);

        oldSum=operationToEdit.amount;

        AuthStore.selectedAssetId=null;
        AuthStore.selectedOperationId=null;
    }

    const handleApplyEdit= async ()=> {
        let assetAmount = 0;
        const operationToEdit = operations.find(operation => operation.id === currentOperationId)
        const oldSum = Number(operationToEdit.amount);

        const delta = (Number(sum) - oldSum) * (operationType === "income" ? 1 : -1);
        if (delta !== 0) {
            assetAmount = assetById(currentAssetId).amount + delta;
            updateAccountAssetField(currentAccountId, currentAssetId, "amount", assetAmount);
            updateOperationField(currentAccountId,currentAssetId,currentOperationId, "amount", sum);
        }
        updateOperationField(currentAccountId,currentAssetId,currentOperationId, "comment", comment);
        updateOperationField(currentAccountId,currentAssetId,currentOperationId, "datetime", new Date(date));
        updateOperationField(currentAccountId,currentAssetId,currentOperationId, "title", title);
        updateOperationField(currentAccountId,currentAssetId,currentOperationId, "category", currentCategory);
        updateOperationField(currentAccountId,currentAssetId,currentOperationId, "rate", rate);
        updateOperationField(currentAccountId,currentAssetId,currentOperationId, "purposeId", currentPurposeId);
        //--------- credit copy
        // if (isCreditNeeded) {
        //     const creditAssetId = operationToEdit?.creditOperation.assetId;
        //     const creditOperationId = operationToEdit?.creditOperation.operationId;
        //     const creditAccountId=assetById(creditAssetId).accountId;
        //
        //     if (delta !== 0) {
        //         assetAmount = assetById(creditAssetId).amount + delta;
        //         updateAccountAssetField(creditAccountId, creditAssetId, "amount", assetAmount);
        //     }
        //     updateOperationField(creditAccountId,creditAssetId,creditOperationId, "comment", comment);
        //     updateOperationField(creditAccountId,creditAssetId,creditOperationId,"datetime", new Date(date));
        //     updateOperationField(creditAccountId,creditAssetId,creditOperationId, "title", title);
        // }

        //---------
        if (operationType === "transfer") {
            const transferToAsset=assetById(transferToAssetId);
            const transferToAccountId=transferToAsset.accountId;
            if (delta !== 0) {
                assetAmount = transferToAsset.amount + delta * rate;
                updateAccountAssetField(transferToAccountId, transferToAssetId, "amount", assetAmount);
            }
            updateOperationField(transferToAccountId,transferToAssetId,transferToAssetId, "comment", comment);
            updateOperationField(transferToAccountId,transferToAssetId,transferToAssetId, "datetime", new Date(date));
            updateOperationField(transferToAccountId,transferToAssetId,transferToAssetId, "title", title);
            updateOperationField(transferToAccountId,transferToAssetId,transferToAssetId, "rate", 1/rate);
        }
        getAssets(userPreference.accounts, userPreference.assets);
        getAccountAssetOperations(currentAccountId,currentAssetId)

        setChangingMode(false);
        await setCurrentCategory("")
        await setTitle("")
        await setSum(0)
        await setComment("")
        await setDate(null);
        setCurrentOperationId("")


    }
    const handleCancelEdit= async ()=>{

        setChangingMode(false);
        await setCurrentCategory("")
        await setTitle("")
        await setSum(0)
        await setComment("")
        await setDate(null);
        setCurrentOperationId("")


    }
    const handleDeleteOperation= async ()=> {

        //********************************************
        const operationToDelete = operations.find(operation => operation.id===currentOperationId)
        const deltaSum= Number(operationToDelete.amount) * (operationToDelete.type === "income" ? -1 : 1);
        const operationAssetAmount = assetById(currentAssetId).amount + deltaSum;

        await updateAccountAssetField(
            currentAccountId, currentAssetId,"amount", operationAssetAmount
        );
        await deleteOperation(currentAccountId,currentAssetId,currentOperationId)

        if (operationToDelete.creditOperation) {
            const creditAssetId = operationToDelete?.creditOperation.assetId;
            const creditOperationId = operationToDelete?.creditOperation.operationId;
            const creditOperation = await getAccountAssetOperation(assetById(creditAssetId).accountId,creditAssetId,creditOperationId);
            const creditDeltaSum = Number(creditOperation.amount) * (creditOperation.type === "income" ? -1 : 1);
            const creditAssetAmount = assetById(creditAssetId)?.amount +
                Number(creditOperation ? creditDeltaSum : deltaSum);

            await updateAccountAssetField(
                assetById(creditAssetId).accountId, creditAssetId,"amount", creditAssetAmount
            );
            await deleteOperation(assetById(creditAssetId).accountId,creditAssetId,creditOperationId)

        }
        if (operationToDelete?.transferToOperation) {
            const transferToAssetId = operationToDelete?.transferToOperation?.assetId;
            const transferToOperationId = operationToDelete?.transferToOperation?.id;
            const transferToAssetAmount = assetById(transferToAssetId)?.amount - deltaSum;

            await updateAccountAssetField(
                assetById(transferToAssetId).accountId, transferToAssetId,"amount", transferToAssetAmount
            );
            await deleteOperation(assetById(transferToAssetId).accountId,transferToAssetId,transferToOperationId)
        }

        await getAssets(userPreference.accounts, userPreference.assets);
        await getAccountAssetOperations(currentAccountId,currentAssetId)


        setChangingMode(false);
        await setCurrentCategory("")
        await setTitle("")
        await setSum(0)
        await setComment("")
        await setDate(null);
        setCurrentOperationId("")

    }
    const boxRef = useRef(null);

    useEffect(() => {
        const usedHeight= 400

        const updateTableHeight = () => {
            setTableHeight(boxRef.current.offsetHeight - usedHeight);
        };

        // Add event listener for window resize
        window.addEventListener('resize', updateTableHeight);

        // Set initial table height
        setTableHeight(boxRef.current.offsetHeight - usedHeight);

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('resize', updateTableHeight);
        };
    });

    return (
        <Box className="page" ref={boxRef}>
            <Box className="title-box" >
                <Typography variant = "h5">
                    Operations
                </Typography>
            </Box>

            <OperationEditor
                purposes={purposes}
                currentPurpose={currentPurposeId}
                changingMode={changingMode}
                operationData = {operationDataForEditor}
                categories={getCategoriesOfOperations(filteredOperations).filter((c)=>
                    c!=="credit return" && c!=="transfer from" && c!=="transfer to"
                )}
                titles={getTitlesOfOperations(filteredOperations)}
                onOperationTypeChange={handleOperationTypeChange}
                onAssetChange={handleAssetChange} onCreditFromAssetChange={handleCreditFromAssetChange}
                onPurposeChange={handlePurposeChange}
                onTransferToAssetChange={handleTransferToAssetChange} onRateChange={handleRateChange}
                onCategoryChange={handleCategoryChange}
                onTitleChange={handleTitleChange} onSumChange={handleSumChange}
                onCommentChange={handleCommentChange}
                onDateChange={handleDateChange}
                onAddNewOperation={handleAddOperation}
                onCancelClick={handleCancelEdit}
                onApplyClick={handleApplyEdit}
            />

            {tableHeight>80 && ( <Box
                className="resultContainer" sx = {{maxHeight: tableHeight, mt:2}}>



                <OperationsTable operations = {filteredOperations} currencies = {currencies}
                                 currentOperationId={currentOperationId}
                                 onRowSelect={handleEditOperation} onDeleteOperation={handleDeleteOperation}
                  />
            </Box>)}
        </Box>
    );
});
