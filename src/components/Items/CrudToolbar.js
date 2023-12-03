import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

export const CrudToolbar = ({onCancelClick, onApplyClick}) => {
    return (
        <Box className="toolbarContainer" >
            <Button variant = "contained" onClick = {onCancelClick}>Cancel</Button>
            <Button variant = "contained" onClick = {onApplyClick}>Apply</Button>
        </Box>
    );
};
