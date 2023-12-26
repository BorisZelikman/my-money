import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {FormControlLabel, Input} from "@mui/material";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import {DatePicker} from "@mui/x-date-pickers";
import MenuItem from "@mui/material/MenuItem";
import {CheckBox} from "@mui/icons-material";
import Checkbox from "@mui/material/Checkbox";
import {useEffect, useState} from "react";

export const FieldsValuesFilter = ({creditCount, onChange}) => {
    const [filter, setFilter] = useState({
        search:"",
        payments:true,
        incomes:true,
        credits:false
    });
    useEffect(() => {
        onChange(filter);
    }, [filter]);
    return (
        <Box className="filterContainer" sx={{m:1, gap:1, alignItems:"center"}}>
            <TextField
                select
                size="small"
                sx = {{backgroundColor: "white",minWidth:150}}
                label ="Category"
                variant="outlined"
            >

            </TextField>
            <FormControlLabel sx={{m:0}}
                control={<Checkbox color="primary" sx={{p:0}}
                                   checked={filter.payments}
                                   onChange={()=>{
                                       setFilter(currentFilter=>({...filter, payments:!currentFilter.payments}))
                                   }}
                />}


                              label="Payment"
                labelPlacement="top"
            />
            <FormControlLabel sx={{m:0}}
                control={<Checkbox color="primary" sx={{p:0}}
                                   checked={filter.incomes}
                                   onChange={()=>{
                                       setFilter(currentFilter=>({...filter, incomes:!currentFilter.incomes}))
                                   }}
                />}
                label="Income"
                labelPlacement="top"
            />
            <FormControlLabel sx={{m:0}}
                control={<Checkbox color="primary" sx={{p:0}}
                                   checked={filter.credits}
                                   onChange={()=>{
                                       setFilter(currentFilter=>({...filter, credits:!currentFilter.credits}))
                                   }}
                />}

                              label={creditCount}
                labelPlacement="top"
            />


        </Box>
    );
};
