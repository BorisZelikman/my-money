import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import {InputAdornment} from "@mui/material";
import {getCurrencySymbol} from "../../data/currencyMethods";

export const InputFields = ({title, sum, comment, currencySymbol,
                            handleTitleChange, handleSumChange, handleCommentChange}) => (
    <>
        <Box sx = {{width: "100%", display: "flex", alignItems: "center", gap: 0.5}}>
            <TextField size="small"
                required
                sx = {{width: "70%", backgroundColor: "white"}}
                label = "Title"
                value = {title}
                onChange = {handleTitleChange}
            />
            <TextField size="small"
                required
                sx = {{width: "30%", backgroundColor: "white"}}
                label = "Sum"
                // type = "number"
                value = {sum}
                onChange = {handleSumChange}
                InputProps = {{endAdornment: (
                    <InputAdornment position = "end">
                        {currencySymbol}
                    </InputAdornment>
                )}}
            />
        </Box>
        <TextField size="small"
            sx = {{width: "100%", backgroundColor: "white"}}
            label = "Comment"
            value = {comment}
            onChange = {handleCommentChange}
        />
    </>
);
