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

export const AmountCheckbox = ({amountTitle, color, checked, onChange}) => {
    return (<Box  sx={{m:0,px:0.2,pb:0.4, color:"white", display:"flex", flexDirection:"column", justifyContent:"center"}}>

            {/*<FormControlLabel sx={{m:0,px:0.5, color:"white", backgroundColor:color}}*/}
            {/*    control={<Checkbox*/}
            {/*                       checked={checked}*/}
            {/*                       onChange={onChange}*/}
            {/*    />}*/}
            {/*    label={amountTitle}*/}
            {/*    labelPlacement="bottom"*/}
            {/*/>*/}
            {/*<input type="checkbox"/>*/}
            <Checkbox checked={checked} onChange={onChange} sx={{p:0}}/>
            <div style={{color:"white",borderRadius:3,backgroundColor:color, paddingRight:"5px", paddingLeft:"5px", fontSize:"12px"}}>
                {amountTitle}
            </div>
        </Box>
    );
};
