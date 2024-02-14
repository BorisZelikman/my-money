import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';
import {Input} from "@mui/material";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import {DatePicker} from "@mui/x-date-pickers";
import {useEffect, useState} from "react";

export const DateIntervalPicker = ({fromDate, toDate, viewMode, onChange}) => {
    const [interval, setInterval] = useState({
        from : fromDate,
        to : toDate
    });
    useEffect(() => {
        onChange(interval);
    }, [interval]);
    return (
        <Box className="filterContainer" sx={{m:1, gap:0.3}}>
            {viewMode==="Common"&&<IconButton onClick={()=>{
                const fromDate = new Date(2023, 10, 1);
                fromDate.setHours(0, 0, 0, 0);
                setInterval({from: fromDate, to:new Date()})}}>
                <StartOutlinedIcon />
            </IconButton>}
            <DatePicker label="From" slotProps={{ textField: { size: 'small' } }}
                        sx = {{ backgroundColor: "white",  p:0}}
                        format="DD.MM.YY"
                        value={dayjs(fromDate)}
                        maxDate={dayjs(toDate)}
                        onChange={(newValue)=>{
                            setInterval(()=>({...interval, from:newValue.$d}))
                        }}
            />
            -
            <DatePicker label="To" slotProps={{ textField: { size: 'small' } }}
                        sx = {{ backgroundColor: "white",  p:0}}
                        format="DD.MM.YY"
                        value={dayjs(toDate)}
                        minDate={dayjs(fromDate)}
                        onChange={(newValue)=>{
                            setInterval(()=>({...interval, to:newValue.$d}))
                        }}
            />
        </Box>
    );
};
