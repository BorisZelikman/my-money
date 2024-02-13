import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import {getOperationsSum} from "../../data/dataFunctions";

export const CommonTable = ({participantData, purposes, operations, filter, currentPurposeId = null}) => {
    const isInInterval = (datetime) => {
        const date = new Date(datetime.seconds * 1000);
        return filter?.start <= date && date <= filter?.end;
    }

    const sum = Math.round(getOperationsSum(
        operations.filter(o => (currentPurposeId ? o.purposeId === currentPurposeId : true) && isInInterval(o.datetime))
    ))

    const norm = Math.round(sum * participantData.rate);

    const fact = Math.round(getOperationsSum(
        operations.filter(o => (currentPurposeId ? o.purposeId === currentPurposeId : true) &&
            o.accountId === participantData.accountId && isInInterval(o.datetime))
    ))

    const diff = fact - norm
    return (
        <Box className="verticalContainerCommon">
            <div className="smallText">{sum}</div>
            <div className="smallText">{norm}</div>
            <div className="smallText">{fact}</div>
            <div className="smallText" style={diff < 0 && !currentPurposeId ? {
                backgroundColor: "red",
                color: "white"
            } : {backgroundColor: "transparent", color: "black"}}>{diff}</div>
            {/*<div className="smallText" style={diff<0?{color:"red"}:{color:"blue"}}>⚖{diff}</div>*/}
        </Box>
    )
};
