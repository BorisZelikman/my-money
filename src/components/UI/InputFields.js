import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import {InputAdornment} from "@mui/material";
import { DatePicker} from "@mui/x-date-pickers";
import dayjs from "dayjs";
import 'dayjs/locale/de';
import {useEffect, useState} from "react";


export const InputFields = ({title, sum, comment, date, currencySymbol,
                            onTitleChange, onSumChange, onCommentChange, onDateChange}) => {

    const [selectedDate, setSelectedDate]= useState()


    useEffect(() => {
        if (date!=="") setSelectedDate(new Date(date));
        console.log(date)
    }, [date]);

    useEffect(() => {
        console.log(selectedDate)
    }, [selectedDate]);

    return(
    <>
        <Box sx = {{width: "100%", display: "flex", alignItems: "center", gap: 0.5}}>
            <TextField size="small"
                required
                sx = {{width: "70%", backgroundColor: "white"}}
                label = "Title"
                value = {title}
                onChange = {onTitleChange}
            />
            <TextField size="small"
                required
                sx = {{width: "30%", backgroundColor: "white"}}
                label = "Sum"
                type = "number"
                value = {sum}
                onChange = {onSumChange}
                InputProps = {{endAdornment: (
                    <InputAdornment position = "end">
                        {currencySymbol}
                    </InputAdornment>
                )}}
            />
        </Box>
        <Box sx = {{width: "100%", display: "flex", alignItems: "center", gap: 0.5}}>
            <TextField size="small"
                sx = {{width: date?"70%":"100%", backgroundColor: "white"}}
                label = "Comment"
                value = {comment}
                onChange = {onCommentChange}
            />
            {date && <DatePicker label="Date" slotProps={{ textField: { size: 'small' } }}
                                sx = {{width: "30%", backgroundColor: "white",  p:0}}
                        format="DD.MM.YY"
                        value={dayjs(selectedDate)}
                                 onChange={onDateChange}
            maxDate={dayjs(new Date())}/>}
        </Box>

</>
)};
