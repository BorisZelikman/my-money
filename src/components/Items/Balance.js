import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";

export const Balance = () => {
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalsAmount, setTotalsAmount] = useState(0);

    const {userId} = useParams();
    const currencyTotals = {};

    const {actives, getAssets} = useAssets();

    useEffect(() => {
        if (userId) {
            getAssets(userId);
        }
    }, []);

    useEffect(() => {
        const total = actives.reduce((total, asset) => total + asset.amount, 0);
        setTotalAmount(total.toFixed(2));
        const totals = actives.reduce((acc, asset) => {
            const {currency, amount} = asset;
            acc[currency] = (acc[currency] || 0) + amount;
            return acc;
        }, {});

        setTotalsAmount(totals);
    }, [actives]);

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Typography align = "center" variant = "h6">
                    BALANCE
                </Typography>
                {actives.map((asset) => (
                    <Asset key = {asset.id} asset = {asset}/>
                ))}
                <Typography align = "center" variant = "h6">
                    TOTAL:
                </Typography>
                {Object.entries(totalsAmount).map(([currency, total]) => (
                    <Typography
                        key = {currency}
                        align = "center"
                        variant = "overline"
                        sx = {{lineHeight: "1"}}
                    >
                        {total.toFixed(2)} {currency}
                    </Typography>
                ))}
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "add_asset">Add asset</Link>
                </Button>
            </Stack>
        </Box>
    );
};
