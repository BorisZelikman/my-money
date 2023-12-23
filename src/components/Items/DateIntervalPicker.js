import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Input} from "@mui/material";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import {DatePicker} from "@mui/x-date-pickers";

export const DateIntervalPicker = ({onChange}) => {
    return (
        <Box className="filterContainer" sx={{m:1, gap:0.3}}>
            <DatePicker label="From" slotProps={{ textField: { size: 'small' } }}
                        sx = {{ backgroundColor: "white",  p:0}}
                        format="DD.MM.YY"
                        onChange={onChange}
            />
            -
            <DatePicker label="To" slotProps={{ textField: { size: 'small' } }}
                        sx = {{ backgroundColor: "white",  p:0}}
                        format="DD.MM.YY"
                        onChange={onChange}
            />
        </Box>
    );
};
