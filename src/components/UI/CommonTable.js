import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import {getOperationsSum} from "../../data/dataFunctions";

export const CommonTable = ({participantData, purposes, operations, filter, currentPurposeId = null}) => {
    const isInInterval = (datetime) => {
        const date = new Date(datetime.seconds * 1000);
        return filter?.start <= date && date <= filter?.end.setHours(23, 59, 59, 999);
    }
    const settlementsPurposeId = purposes.find((p => p.isSettlement)).id;
    const isSettlement = settlementsPurposeId === currentPurposeId;
    const settlementsSumFromMyAccount = Math.round(getOperationsSum(
        operations.filter(o => o.purposeId === settlementsPurposeId && o.accountId === participantData.accountId && isInInterval(o.datetime))
    ))
    const settlementsSumFromOtherAccounts = Math.round(getOperationsSum(
        operations.filter(o => o.purposeId === settlementsPurposeId && o.accountId !== participantData.accountId && isInInterval(o.datetime))
    ))
    const settlementsSum = settlementsSumFromMyAccount - settlementsSumFromOtherAccounts;

    // sum of all operations without settlement
    const sum = Math.round(getOperationsSum(
        operations.filter(o =>
            (currentPurposeId && !isSettlement ? o.purposeId === currentPurposeId : true) &&
            o.purposeId !== settlementsPurposeId &&
            isInInterval(o.datetime))
//        operations.filter(o => (currentPurposeId ? o.purposeId === currentPurposeId : true) && isInInterval(o.datetime))
    ))

    const norm = Math.round(sum * participantData.rate);

    const fact = Math.round(getOperationsSum(
        operations.filter(o => (currentPurposeId && !isSettlement ? o.purposeId === currentPurposeId : true) &&
            o.accountId === participantData.accountId && o.purposeId !== settlementsPurposeId && isInInterval(o.datetime))
    ))

    const diff = fact - norm
    const settlementResult = diff + settlementsSum
    console.log(isSettlement, settlementResult)
    return (
        <Box className="verticalContainerCommon">
            {isSettlement ? <>
                    <div className="smallText" style={{color: "indianred"}}>{settlementsSumFromMyAccount}</div>
                    <div className="smallText" style={{color: "green"}}>{settlementsSumFromOtherAccounts}</div>
                    <div className="smallText"
                         style={settlementsSum >= 0 ? {color: "indianred"} : {color: "green"}}>
                        {Math.abs(settlementsSum)}
                    </div>
                    <div className="smallText" style={settlementResult < 0 ?
                        {backgroundColor: "indianred", color: "white"} :
                        {backgroundColor: "darkgreen", color: "white"}}>
                        {settlementResult}
                    </div>
                </>
                : <>
                    <div className="smallText">{sum}</div>
                    <div className="smallText">{norm}</div>
                    <div className="smallText">{fact}</div>
                    <div className="smallText" style={diff < 0 && !currentPurposeId ?
                        {color: "indianred"} : {color: "darkgreen"}}>{diff}</div>
                </>}
        </Box>)
};
