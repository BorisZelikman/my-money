import React from 'react';
import Button from "@mui/material/Button";

const AddButton = ({ buttonAddClicked }) => (
    <Button
        variant="contained"
        size="large"
        style={{width: 300, marginTop: 10}}
        onClick={() => buttonAddClicked()}
    >
        Add
    </Button>
);

export default AddButton;
