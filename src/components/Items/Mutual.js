import {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import {useMutuals} from "../../hooks/useMutuals";
import {Backdrop, CircularProgress} from "@mui/material";
import {calcTotalForOperations, calcTotalForSameCurrencyOperations} from "../../data/currencyMethods";
import {getOperationsSum} from "../../data/dataFunctions";

export const Mutual = ({userPreference, mutualIds, exchangeRates, onProcess}) => {
    const {mutualOperations, purposes, participants, getPurposes, getMutualOperations, getParticipants} = useMutuals()
    const [waitScreen, setWaitScreen] = useState(false)
    const[userAccountId, setUserAccountId]=useState(null)
    const[userRate, setUserRate]=useState(null)


    useEffect(() => {
        if (mutualIds?.length>0) {
            getPurposes(mutualIds[0])
            getMutualOperations(mutualIds[0])
            getParticipants(mutualIds[0])
        }
    }, [mutualIds]);
    useEffect(() => {
        if (!participants || !userPreference) return;

        for (const participant of participants) {
            const found =userPreference.accounts.find((e)=>e.id===participant.accountId);
            if (found) {setUserAccountId(participant.accountId)
                setUserRate(participant.rate)
            }
        }

    }, [participants, userPreference]);

    function getMonthDifference(startDate, endDate) {
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth()+1;

        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth()+1;

        return (endYear - startYear) * 12 + (endMonth - startMonth);
    }



    useEffect(() => {
        if (!mutualOperations || !purposes) return;



        let fromNovemberOperations = mutualOperations.filter((o) => {
            const date = new Date(o.datetime.seconds * 1000);

            const fromDate = new Date(2023, 10, 1);
            fromDate.setHours(0, 0, 0, 0);

            return fromDate <= date ;
        });

        const firstOperationDate=new Date(fromNovemberOperations[fromNovemberOperations.length-1].datetime.seconds*1000)
        const totalMonths=getMonthDifference(firstOperationDate,new Date());
        console.log("days:",(new Date()).getDate())
        console.log("Months from november:",totalMonths)

        const total=getOperationsSum(fromNovemberOperations);
        const userTotal=getOperationsSum(fromNovemberOperations.filter(o=>o.accountId===userAccountId));
        console.log("Total:", total," *", userRate, "=", userRate*total, "my:",userTotal, "   !:", userTotal-userRate*total );
        for (const purpose of purposes) {
            const purposeOps=fromNovemberOperations.filter(o=>o.purposeId===purpose.id);
            const sum = getOperationsSum(purposeOps)
            console.log(purpose.title, sum);
            console.log(purposeOps)
        }
        console.log(mutualOperations)

    }, [mutualOperations, purposes]);

    return (
        <Box className="horisontalContainerForWidescreen">

            <Box className="verticalContainer alignCenter">

                <Box className="toolbarContainer">

                    <div className="right-component horisontalContainer">
                        Rate:{userRate} accountId:{userAccountId}
                    </div>
                </Box>
            </Box>
            <Backdrop open={waitScreen}>
                <CircularProgress color="inherit"/>
            </Backdrop>
        </Box>
    );
};
