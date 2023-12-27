import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Input} from "@mui/material";
import TextField from "@mui/material/TextField";
import {DateIntervalPicker} from "./DateIntervalPicker";
import {Search} from "@mui/icons-material";
import {InputSearch} from "./InputSearch";
import {FieldsValuesFilter} from "./FieldsValuesFilter";
import {useEffect, useState} from "react";
import {calcTotalForOperations} from "../../data/currencyMethods";

export const OperationsFilter = ({assets, operations, onChange}) => {
    const [filterValues, setFilterValues]=useState({
        search: "",
        fromDate: new Date(),
        toDate: new Date(),
        category: "",
        payments: true,
        incomes: true,
        credits: false
    })

    const [creditCount, setCreditCount]= useState(0);
    const [incomeCount, setIncomeCount]= useState(0);
    const [paymentCount, setPaymentCount]= useState(0);
    const [filteredOperations, setFilteredOperations]= useState([]);

    useEffect(() => {
        if (assets.length===0 || operations.length===0) return;
        const assetToCurrencyMap = new Map(assets.map(asset => [asset.id, asset.currency]));
        const assetToTitleMap = new Map(assets.map(asset => [asset.id, asset.title]));
        const operationsWithCurrency = operations.map(operation => ({
            ...operation,
            currency: assetToCurrencyMap.get(operation.assetId),
            assetTitle: assetToTitleMap.get(operation.assetId),
        }));
        setFilteredOperations(operationsWithCurrency)
    }, [assets, operations])

    useEffect(() => {
        console.table(filteredOperations)
    }, [filteredOperations]);

    useEffect(() => {
        if (assets.length===0 || operations.length===0) return;
        const currentDate = new Date();
        const previousWeekDate = new Date(currentDate);
        previousWeekDate.setDate(currentDate.getDate() - 1);

        const dateOperations=operations.filter((o) =>
            previousWeekDate<=new Date(o.datetime.seconds*1000) && new Date(o.datetime.seconds*1000) <=currentDate);

        const paymentOperations=dateOperations.filter((o) => o.type === "payment" );
        const paymentAmount=paymentOperations.reduce((acc, opp) =>
            acc +parseFloat(opp.amount),0).toFixed(0)

        setPaymentCount( paymentAmount);
        setIncomeCount( operations.filter((o) => o.type === "income" ).length);
        setCreditCount ( operations.filter((o) => o.category === "credit").length);
    }, [operations, filterValues])

    useEffect(() => {

    }, [creditCount])

    useEffect(() => {
        console.table(filterValues)
        onChange(filterValues)
    }, [filterValues]);
    const handleFieldsValuesFilterChange=(filterData)=>{
        setFilterValues(()=>({...filterValues,
            category: filterData.category,
            incomes: filterData.incomes,
            payments: filterData.payments,
            credits: filterData.credits}));
    }
    const handleDateChange=(filterData)=>{
        setFilterValues(()=>({...filterValues,
            fromDate: filterData.fromDate,
            toDate: filterData.toDate
        }));
    }
    return (
        <Box className="horisontalContainerForWidescreen" >
            <InputSearch/>
            <DateIntervalPicker onChange={handleDateChange}/>
            <FieldsValuesFilter
                paymentAmount={paymentCount}
                incomeAmount={incomeCount}
                creditAmount={creditCount}
                onChange={handleFieldsValuesFilterChange}/>
        </Box>
    );
};
