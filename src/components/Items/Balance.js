import React, {useEffect, useState} from "react";
import {loadAssetData} from "../../data/assetMethods";
import {Link} from "react-router-dom";
import {Asset} from "./Asset";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

function Balance() {
    const [assetData, setAssetData] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const loadedData = loadAssetData();
        setAssetData(loadedData);
        setTotalAmount(loadedData.reduce((total, asset) => total + asset.amount, 0));
    }, []);

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Typography align = "center" variant = "h6">
                    BALANCE
                </Typography>

                {assetData.map((asset) => (
                    <Asset key = {asset.id} asset = {asset}/>
                ))}

                <Typography align = "center" variant = "h6">
                    TOTAL: {totalAmount}
                </Typography>
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "add">Add asset</Link>
                </Button>
            </Stack>
        </Box>
    );
}

export default Balance;
