import {useEffect} from "react";
import {Link} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";
import useMediaQuery from "@mui/material/useMediaQuery";

export const Balance = () => {
    const {assets, getAssets} = useAssets();
    const isMediumWidthScreen = useMediaQuery("(min-width: 901px)");

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
            flexDirection: isMediumWidthScreen ? "row" : "column",
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
                py: 2,
                gap: 1
            }}>
                {assets.map((asset) => (
                    <Asset key = {asset.id} asset = {asset}/>
                ))}
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                maxHeight: "auto",
                alignItems: "center",
                width: "50%",
                py: 1
            }}>
                <Typography align = "center" variant = "h6">
                    TOTAL:
                </Typography>
                <Box sx = {{
                    display: "flex",
                    flexDirection: isMediumWidthScreen ? "column" : "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "auto",
                    width: "90%"
                }}>
                    {Object.entries(totals).map(([currency, total]) => (
                        <Typography align = "center" variant = "overline" sx = {{fontWeight: 500}}>
                            &nbsp;{currency}&nbsp;
                            <Typography align = "center" variant = "overline">
                                {total.toFixed(2)}
                            </Typography>
                        </Typography>
                    ))}
                </Box>
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "add_asset">Add new asset</Link>
                </Button>
            </Box>
        </Box>
    );
};
