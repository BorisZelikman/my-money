import {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import {useMutuals} from "../../hooks/useMutuals";
import {Backdrop, CircularProgress} from "@mui/material";
import {calcTotalForOperations, calcTotalForSameCurrencyOperations} from "../../data/currencyMethods";
import {getOperationsSum} from "../../data/dataFunctions";

export const Mutual = ({mutualIds, exchangeRates, onProcess}) => {
    const {allOperations, purposes, getPurposes, getMutualOperations} = useMutuals()
    const [waitScreen, setWaitScreen] = useState(false)

    useEffect(() => {
        if (mutualIds?.length>0) {
            getPurposes(mutualIds[0])
            getMutualOperations(mutualIds[0])
        }
    }, [mutualIds]);

    useEffect(() => {
        if (!allOperations || !purposes) return;

        for (const purpose of purposes) {
            const purposeOps=allOperations.filter(o=>o.purposeId===purpose.id);
            const sum = getOperationsSum(purposeOps)
            console.log(purpose.title, sum);
            console.log(purposeOps)
        }
        console.log(allOperations)

    }, [allOperations, purposes]);

    return (
        <Box className="horisontalContainerForWidescreen">

            <Box className="verticalContainer alignCenter">

                <Box className="toolbarContainer">

                    <div className="right-component horisontalContainer">
                    </div>
                </Box>
            </Box>
            <Backdrop open={waitScreen}>
                <CircularProgress color="inherit"/>
            </Backdrop>
        </Box>
    );
};
