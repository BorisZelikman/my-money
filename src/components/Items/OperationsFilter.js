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
import {getCategoriesOfOperations, getOperationsSum} from "../../data/dataFunctions";

export const OperationsFilter = ({operations, filteredOperations, onChange}) => {
    const [filterValues, setFilterValues]=useState({
        search: "",
        fromDate: new Date(new Date().setDate(new Date().getDate()-7)),
        toDate:  new Date(),
        category: null,
        payments: true,
        incomes: true,
        credits: false
    })

    const [creditCount, setCreditCount]= useState(0);
    const [incomeCount, setIncomeCount]= useState(0);
    const [paymentCount, setPaymentCount]= useState(0);
    const [categoryList, setCategoryList]= useState([]);

    useEffect(() => {
        if (operations.length === 0) return;

        let dateOperations = operations.filter((o) => {
            const date = new Date(o.datetime.seconds * 1000);

            const fromDate = new Date(filterValues.fromDate);
            fromDate.setHours(0, 0, 0, 0);

            const toDate = new Date(filterValues.toDate);
            toDate.setHours(23, 59, 59, 999);
            return fromDate <= date && date <= toDate;
        });

        if (filterValues.category!==null) dateOperations = dateOperations.filter((o) => o.category === filterValues.category);

        const paymentOperations = dateOperations.filter((o) =>
            filterValues.credits ? o.type === "payment"
                : o.type === "payment" && o.category !== "credit");

        setPaymentCount(getOperationsSum(paymentOperations));
        setIncomeCount(getOperationsSum(dateOperations.filter((o) => o.type === "income" )));
        setCreditCount(getOperationsSum(dateOperations.filter((o) => o.category === "credit")));
        setCategoryList(getCategoriesOfOperations(dateOperations))
    }, [operations, filterValues])

    useEffect(() => {
        onChange(filterValues)
    }, [filterValues]);

    const handleFieldsValuesFilterChange=(filterData)=>{
        setFilterValues(()=>({...filterValues,
            category: filterData.category,
            incomes: filterData.incomes,
            payments: filterData.payments,
            credits: filterData.credits}));
    }

    const handleDateChange=(interval)=>{
        setFilterValues(()=>({...filterValues,
            fromDate: interval.from,
            toDate: interval.to
        }));
    }

    return (
        <Box className="horisontalContainerForWidescreen" >
            <InputSearch/>
            <DateIntervalPicker fromDate={filterValues.fromDate} toDate={filterValues.toDate} onChange={handleDateChange}/>
            <FieldsValuesFilter
                categories={categoryList}
                paymentAmount={paymentCount}
                incomeAmount={incomeCount}
                creditAmount={creditCount}
                onChange={handleFieldsValuesFilterChange}/>
        </Box>
    );
};
