import {useEffect} from "react";
import {Link} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";

export const Balance = () => {
    const {assets, getAssets} = useAssets();

    useEffect(() => {
        getAssets(AuthStore.currentUserID);
    }, []);

    const totals = assets.reduce((acc, asset) => {
        const {currency, amount} = asset;
        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
    }, {});

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                width: "90%",
                overflowY: "auto",
                gap: 1
            }}>
                {assets.map((asset) => (
                    <Asset key = {asset.id} asset = {asset}/>
                ))}
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                maxHeight: "100px",
                overflowY: "auto",
                width: "90%",
                py: 1
            }}>
                <Typography align = "center" variant = "h6">
                    TOTAL:
                </Typography>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "row",
                    height: "100px",
                    overflow: "auto",
                    width: "90%"
                }}>
                    {Object.entries(totals).map(([currency, total]) => (
                        <Typography variant = "overline">
                            {total.toFixed(2)}{currency}
                        </Typography>
                    ))}
                </Box>
            </Box>
            <Button>
                <Link style = {{textDecoration: "none"}} to = "add_asset">Add asset</Link>
            </Button>
        </Box>
    );
};
