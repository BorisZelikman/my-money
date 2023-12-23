import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Input} from "@mui/material";
import TextField from "@mui/material/TextField";

export const InputSearch = ({onChange}) => {
    return (
        <Box className="filterContainer" sx={{m:1}}>
            <TextField size="small"
                       sx = {{backgroundColor: "white",mr:0.2, minWidth:"60px"}}
                       label = "Search"
            />
            <Button variant = "contained" >Search</Button>
        </Box>
    );
};
