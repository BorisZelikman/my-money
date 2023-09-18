import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import {InputAdornment} from "@mui/material";
import {getCurrencySymbol} from "../../data/currencyMethods";

export const InputFields = ({title, sum, comment, currencySymbol,
                            handleTitleChange, handleSumChange, handleCommentChange}) => (
    <>
        <Box sx = {{width: "100%", display: "flex", alignItems: "center"}}>
            <TextField
                required
                sx = {{width: "70%"}}
                label = "Title"
                value = {title}
                onChange = {handleTitleChange}
            />
            <TextField
                required
                sx = {{width: "30%"}}
                label = "Sum"
                type = "number"
                value = {sum}
                onChange = {handleSumChange}
                InputProps = {{endAdornment: (
                    <InputAdornment position = "end">
                        {currencySymbol}
                    </InputAdornment>
                )}}
            />
        </Box>
        <TextField
            sx = {{width: "100%"}}
            label = "Comment"
            value = {comment}
            onChange = {handleCommentChange}
        />
    </>
);
