import {useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Asset} from "./Asset/Asset";
import {useAssets} from "../../hooks/useAssets";
import AuthStore from "../../Stores/AuthStore";
import useMediaQuery from "@mui/material/useMediaQuery";

export const Balance = () => {
    const {assets, getAssets} = useAssets();
    const isSmallHeightScreen = useMediaQuery("(max-height: 500px)");
    const isLargeWidthScreen = useMediaQuery("(min-width: 801px)");
    const navigate = useNavigate();
    
    useEffect(() => {
        if (AuthStore.currentUserID === null) {
            navigate(`/`);
        }
        else {
            getAssets(AuthStore.currentUserID);
        }
    }, []);

    const totals = assets.reduce((acc, asset) => {
        const {currency, amount} = asset;
        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
    }, {});

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: isLargeWidthScreen ? "row" : "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                maxHeight: "100%",
                width: "90%"
            }}>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    py: 1,
                    gap: 0.5
                }}>
                    {assets.map((asset) => (
                        <Asset key = {asset.id} asset = {asset}/>
                    ))}
                </Box>
                <Button variant = "contained" sx = {{width: "200px", m: 1}}>
                    <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}}
                          to = "add_asset">ADD NEW ASSET</Link>
                </Button>
                <Box sx = {{
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Typography align = "center" variant = "h6">
                        TOTAL:
                    </Typography>
                    <Box sx = {{
                        display: "flex",
                        flexDirection: isLargeWidthScreen || isSmallHeightScreen ? "row" : "column",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "auto",
                        p: 1
                    }}>
                        {Object.entries(totals).map(([currency, total]) => (
                            <span>
                                <Typography variant = "caption"
                                            sx = {{
                                                m: 0.5,
                                                fontWeight: 500
                                            }}>
                                    {currency}:
                                </Typography>
                                <Typography variant = "caption">
                                    {total.toFixed(2)}
                                </Typography>
                            </span>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
