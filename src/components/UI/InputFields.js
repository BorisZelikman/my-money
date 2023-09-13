import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export const InputFields = ({title, sum, comment, handleTitleChange, handleSumChange, handleCommentChange}) => (
    <>
        <Box sx = {{width: 300, display: "flex", alignItems: "center"}}>
            <TextField
                sx = {{width: "70%"}}
                label = "Title"
                value = {title}
                onChange = {handleTitleChange}
            />
            <TextField
                sx = {{width: "30%"}}
                label = "Sum"
                type = "number"
                value = {sum}
                onChange = {handleSumChange}
            />
        </Box>
        <TextField
            sx = {{width: 300}}
            label = "Comment"
            value = {comment}
            onChange = {handleCommentChange}
        />
    </>
);
