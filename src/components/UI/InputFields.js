import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import {InputAdornment} from "@mui/material";
import {getCurrencySymbol} from "../../data/currencyMethods";

export const InputFields = ({title, sum, comment, currencySymbol,
                            handleTitleChange, handleSumChange, handleCommentChange}) => (
    <>
        <Box sx = {{width: "100%", display: "flex", alignItems: "center", gap: 0.5}}>
            <TextField
                required
                sx = {{width: "70%", backgroundColor: "white"}}
                label = "Title"
                value = {title}
                size="small"
                onChange = {handleTitleChange}
            />
            <TextField
                required
                sx = {{width: "30%", backgroundColor: "white"}}
                label = "Sum"
                type = "number"
                value = {sum}
                onChange = {handleSumChange}
                size="small"
                InputProps = {{endAdornment: (
                    <InputAdornment position = "end">
                        {currencySymbol}
                    </InputAdornment>
                )}}
            />
        </Box>
        <TextField
            sx = {{width: "100%", backgroundColor: "white"}}
            label = "Comment"
            value = {comment}
            size="small"
            onChange = {handleCommentChange}
        />
    </>
);
