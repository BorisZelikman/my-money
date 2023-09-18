import {useEffect, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {signOut} from "firebase/auth";
import {auth} from "../../config/firebase";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import BalanceIcon from "@mui/icons-material/Balance";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import {observer} from "mobx-react";
import AuthStore from "../../Stores/AuthStore";


export const NavigationBar = observer(() => {
  const [showNavBar, setShowNavBar] = useState(true);
  const location = useLocation();
  const [userID, setUserID] = useState(null);

    useEffect(() => {
        setShowNavBar(location.pathname !== "/registration" && location.pathname !== "/");
        setUserID(AuthStore.currentUserID);
    }, [location.pathname]);

    const logOut = async () => {
        try {
            
            await signOut(auth);
            AuthStore.clearStorage();
 

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
