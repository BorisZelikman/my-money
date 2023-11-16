import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import AuthStore from "../../Stores/AuthStore";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import {InputAdornment} from "@mui/material";
import {AddButton} from "./AddButton";
import Button from "@mui/material/Button";
export const AccountEdit = ({accountId, handleAccountsChange, showNewAccount}) => {
     const buttonAddClicked=()=>{

     }
     if (accountId==="New account...") return (
        <Box sx = {{width: "100%", display: "flex", alignItems: "center", gap: 0.5}}>
            <TextField size="small"
                       label = "Account title"
                       // value = {title}
                       // onChange = {handleTitleChange}
            />
            <TextField size="small"
                       label = "Share with user Id"
                       // value = {sum}
                       // onChange = {handleSumChange}
            />
            <Button disabled = {false} buttonAddClicked = {buttonAddClicked}>+</Button>
        </Box>)
    else return null;


}
