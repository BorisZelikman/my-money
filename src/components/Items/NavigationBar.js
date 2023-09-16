import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import useMediaQuery from "@mui/material/useMediaQuery";
import { observer } from "mobx-react";
import AuthStore from "../../Stores/AuthStore";
import Cookies from "js-cookie";

export const NavigationBar = observer(() => {
  const [showNavBar, setShowNavBar] = useState(true);
  const location = useLocation();
  const [userID, setUserID] = useState(null);
  const isScreenSmall = useMediaQuery("(max-height: 400px)");

  useEffect(() => {
    setShowNavBar(location.pathname !== "/registration" && location.pathname !== "/");
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

  return (
    showNavBar && (
      <ButtonGroup variant="text" aria-label="outlined button group"
        orientation={isScreenSmall ? "vertical" : "horizontal"}>
        <Button color="inherit" component={Link} to={`/user-profile/${userID}`}>
          <IconButton><ManageAccountsIcon /></IconButton>
        </Button>
        <Button color="inherit" component={Link} to={`/user-profile/${userID}/operations`}>
          <IconButton><PriceChangeIcon /></IconButton>
        </Button>
        <Button color="inherit" component={Link} to={`/user-profile/${userID}/history`}>
          <IconButton><AccountBalanceWalletIcon /></IconButton>
        </Button>
        <Button color="inherit" component={Link} to={`/user-profile/${userID}/graph`}>
          <IconButton><StackedBarChartIcon /></IconButton>
        </Button>
        <Button color="inherit" component={Link} to={`/user-profile/${userID}/converter`}>
          <IconButton><EuroSymbolIcon /></IconButton>
        </Button>
        <Button color="inherit" onClick={logOut} component={Link} to={`/`}>
          <IconButton><ExitToAppIcon /></IconButton>
        </Button>
      </ButtonGroup>
    )
  );
});
