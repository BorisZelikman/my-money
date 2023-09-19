import {useEffect, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {signOut} from "firebase/auth";
import {auth} from "../../config/firebase";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import useMediaQuery from "@mui/material/useMediaQuery";
import {observer} from "mobx-react";
import AuthStore from "../../Stores/AuthStore";
import Cookies from "js-cookie";
import {Logo} from "../Logo/Logo";

export const NavigationBar = observer(() => {
    const [showNavBar, setShowNavBar] = useState(true);
    const location = useLocation();
    const [userID, setUserID] = useState(null);
    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");

    useEffect(() => {
        setShowNavBar(
            location.pathname !== "/registration" && location.pathname !== "/"
        );
        setUserID(AuthStore.currentUserID);
    }, [location.pathname]);

    const logOut = async () => {
        try {
            await signOut(auth);
            sessionStorage.clear();
            Cookies.remove("authStore");
        }
        catch (err) {
            console.error(err);
        }
    };

    const iconAndTextColor = "rgb(236, 240, 241)";

    return (
        showNavBar && (
            <ButtonGroup variant = "text" aria-label = "outlined button group"
                         orientation = {isMediumWidthScreen || isSmallHeightScreen ? "vertical" : "horizontal"}
            >
                {isMediumWidthScreen && (
                    <Logo style={{width:"150px", color:"orange"}} />
                )}
                <Button color = "inherit" sx = {{justifyContent: "start"}}
                        component = {Link} to = {`/user-profile/${userID}`}>
                    <IconButton sx = {{color: iconAndTextColor}}><ManageAccountsIcon/></IconButton>
                    {isMediumWidthScreen && (
                        <Typography sx = {{color: iconAndTextColor}}>PROFILE</Typography>
                    )}
                </Button>
                <Button color = "inherit" sx = {{justifyContent: "start"}}
                        component = {Link} to = {`/user-profile/${userID}/operations`}>
                    <IconButton sx = {{color: iconAndTextColor}}><PriceChangeIcon/></IconButton>
                    {isMediumWidthScreen && (
                        <Typography sx = {{color: iconAndTextColor}}>OPERATIONS</Typography>
                    )}
                </Button>
                <Button color = "inherit" sx = {{justifyContent: "start"}}
                        component = {Link} to = {`/user-profile/${userID}/history`}>
                    <IconButton sx = {{color: iconAndTextColor}}><AccountBalanceWalletIcon/></IconButton>
                    {isMediumWidthScreen && (
                        <Typography sx = {{color: iconAndTextColor}}>HISTORY</Typography>
                    )}
                </Button>
                <Button color = "inherit" sx = {{justifyContent: "start"}}
                        component = {Link} to = {`/user-profile/${userID}/graph`}>
                    <IconButton sx = {{color: iconAndTextColor}}><StackedBarChartIcon/></IconButton>
                    {isMediumWidthScreen && (
                        <Typography sx = {{color: iconAndTextColor}}>STATISTIC</Typography>
                    )}
                </Button>
                <Button color = "inherit" sx = {{justifyContent: "start"}}
                        component = {Link} to = {`/user-profile/${userID}/converter`}>
                    <IconButton sx = {{color: iconAndTextColor}}><EuroSymbolIcon/></IconButton>
                    {isMediumWidthScreen && (
                        <Typography sx = {{color: iconAndTextColor}}>CONVERTER</Typography>
                    )}
                </Button>
                <Button color = "inherit" sx = {{justifyContent: "start"}}
                        onClick = {logOut} component = {Link} to = {`/`}>
                    <IconButton sx = {{color: iconAndTextColor}}><ExitToAppIcon/></IconButton>
                    {isMediumWidthScreen && (
                        <Typography sx = {{color: iconAndTextColor}}>LOG OUT</Typography>
                    )}
                </Button>
            </ButtonGroup>
        )
    );
});
