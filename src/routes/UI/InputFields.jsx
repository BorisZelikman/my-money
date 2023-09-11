import React from 'react';
import TextField from "@mui/material/TextField";

const InputFields = ({ title, sum, comment, handleTitleChange, handleSumChange, handleCommentChange }) => (
    <>
        <div style={{width: 300, display: "flex", alignItems: "center"}}>
            <TextField
                style={{width: "70%"}}
                label="Title"
                value={title}
                onChange={handleTitleChange}
            />
            <TextField
                style={{width: "30%"}}
                label="Sum"
                type="number"
                value={sum}
                onChange={handleSumChange}
            />
        </div>
        <TextField
            style={{width: 300}}
            label="Comment"
            value={comment}
            onChange={handleCommentChange}
        />
    </>
);

export default InputFields;
