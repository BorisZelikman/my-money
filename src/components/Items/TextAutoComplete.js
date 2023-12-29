import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import {useEffect} from "react";
import {Autocomplete} from "@mui/material";

export const TextAutoComplete = ({label, items, value, onChange}) => {
    return (
        <Autocomplete
            sx={{backgroundColor:"white"}}
            freeSolo
            size= 'small'
            style={{ width: '100%' }}
            options={items}
            getOptionLabel={(option) => option}
            value={value}
            onChange={(event, newValue) => {
                onChange(newValue)
            }}
            renderInput={(params) => (
                <TextField {...params} label={label} variant="outlined" />
            )}
        />
    );
};
