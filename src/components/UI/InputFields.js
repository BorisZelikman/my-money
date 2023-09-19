import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export const InputFields = ({title, sum, comment, handleTitleChange, handleSumChange, handleCommentChange}) => (
    <>
        <Box sx = {{width: "100%", display: "flex", alignItems: "center", gap: 0.5}}>
            <TextField
                required
                sx = {{width: "70%", backgroundColor: "white"}}
                label = "Title"
                value = {title}
                onChange = {handleTitleChange}
            />
            <TextField
                required
                sx = {{width: "30%", backgroundColor: "white"}}
                label = "Sum"
                type = "number"
                value = {sum}
                onChange = {handleSumChange}
            />
        </Box>
        <TextField
            sx = {{width: "100%", backgroundColor: "white"}}
            label = "Comment"
            value = {comment}
            onChange = {handleCommentChange}
        />
    </>
);
