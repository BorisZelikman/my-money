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
    const isSmallHeightScreen = useMediaQuery("(max-height: 500px)");
    const isLargeWidthScreen = useMediaQuery("(min-width: 801px)");

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
                maxHeight: "90%",
                backgroundColor:"#d53838"
            }}>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    maxHeight: "90%",
                    py: 2,
                    gap: 1
                }}>
                    {assets.map((asset) => (
                        <Asset key = {asset.id} asset = {asset}/>
                    ))}
                </Box>
                <Box sx = {{p: 2}}>
                    <Button variant = "contained" sx = {{width: "200px"}}>
                        <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}}
                              to = "add_asset">ADD NEW ASSET</Link>
                    </Button>
                </Box>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                maxHeight: isSmallHeightScreen && !isLargeWidthScreen ? "100px" : "auto",
                alignItems: "center",
                width: "100%",
                py: 1,
                backgroundColor:"#38bdd5"
            }}>
                <Typography align = "center" variant = "h6">
                    TOTAL:
                </Typography>
                <Box sx = {{
                    display: "flex",
                    // flexDirection: isLargeWidthScreen ? "column" : "row",
                    flexDirection: "row",
                    // flexWrap: "wrap",
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
            </Box>
        </Box>
    );
};
