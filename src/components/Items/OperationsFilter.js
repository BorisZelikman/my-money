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

export const OperationsFilter = ({onChange}) => {
    return (
        <Box className="horisontalContainerForWidescreen" >
            <InputSearch/>
            <DateIntervalPicker/>
            <FieldsValuesFilter onChange={onChange}/>
        </Box>
    );
};
