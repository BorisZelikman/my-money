import React, {useEffect, useState} from "react";
import {loadActiveData} from "../../data/activeMethods";
import {Link} from "react-router-dom";
import {Asset} from "./Asset";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

function Balance() {
    const [activeData, setActiveData] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const loadedData = loadActiveData();
        setActiveData(loadedData);
        setTotalAmount(loadedData.reduce((total, active) => total + active.amount, 0));
    }, []);

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Typography align = "center" variant = "h6">
                    BALANCE
                </Typography>

                {activeData.map((active) => (
                    <Asset key = {active.id} active = {active}/>
                ))}

                <Typography align = "center" variant = "h6">
                    TOTAL: {totalAmount}
                </Typography>
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "add">Add active</Link>
                </Button>
            </Stack>
        </Box>
    );
}

export default Balance;
