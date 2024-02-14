import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Autocomplete, FormControlLabel, Input} from "@mui/material";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import {DatePicker} from "@mui/x-date-pickers";
import MenuItem from "@mui/material/MenuItem";
import {CheckBox} from "@mui/icons-material";
import Checkbox from "@mui/material/Checkbox";
import {useEffect, useState} from "react";
import {AmountCheckbox} from "./AmountCheckbox";

export const FieldsValuesFilter = ({
                                       categories, paymentAmount, incomeAmount, commonAmount, creditAmount, viewMode,
                                       onChange
                                   }) => {
    const [filter, setFilter] = useState({
        category: null,
        payments: true,
        incomes: true,
        common: true,
        credits: true,
    });
    const [selectedTitle, setSelectedTitle] = useState(null);
    useEffect(() => {
        onChange(filter);
    }, [filter]);
    return (
        <Box className="filterContainer" sx={{m: 1, gap: 1, alignItems: "center"}}>
            <Autocomplete
                sx={{backgroundColor: "white", width: "200px"}}
                size='small'
                options={categories}
                getOptionLabel={(option) => option}
                value={selectedTitle}
                onChange={(event, newValue) => {
                    setSelectedTitle(newValue)
                    setFilter(currentFilter => ({...filter, category: newValue}))
                }}
                renderInput={(params) => (
                    <TextField {...params} label="Category" variant="outlined"/>
                )}
            />
            <AmountCheckbox color="red" checked={filter.payments} amountTitle={paymentAmount}
                            onChange={() => {
                                setFilter(currentFilter => ({...filter, payments: !currentFilter.payments}))
                            }}
            />

                <AmountCheckbox color="green" checked={filter.incomes} amountTitle={incomeAmount}
                                onChange={() => {
                                    setFilter(currentFilter => ({...filter, incomes: !currentFilter.incomes}))
                                }}
                />

            {viewMode!=="Common" &&<AmountCheckbox color="gray" checked={filter.common} amountTitle={commonAmount}
                                onChange={() => {
                                    setFilter(currentFilter => ({...filter, common: !currentFilter.common}))
                                }}
                />}
            {/*<AmountCheckbox color="gray" checked={filter.credits} amountTitle={creditAmount}*/}
            {/*                onChange={()=>{*/}
            {/*                    setFilter(currentFilter=>({...filter, credits:!currentFilter.credits}))*/}
            {/*                }}*/}
            {/*/>*/}
        </Box>
    );
};
