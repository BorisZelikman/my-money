import React, { useState, useEffect }  from 'react';
import { Link, useLocation } from "react-router-dom";
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BalanceIcon from '@mui/icons-material/Balance';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import {auth} from "../../config/firebase";
import {signOut} from "firebase/auth";

function NavigationBar({ userID }) {
  const [showNavBar, setShowNavBar] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setShowNavBar(location.pathname !== '/registration' && location.pathname !== '/');
  }, [location.pathname]);

      const logOut = async () => {
        try {
            await signOut(auth);
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
    showNavBar && (
      <ButtonGroup variant="contained" color="primary" aria-label="text primary button group">
        <Button variant="outlined" color="inherit" component={Link} to={`/user-profile/${userID}`}>
          <IconButton><ManageAccountsIcon/></IconButton>
        </Button>
        <Button variant="outlined" color="primary" component={Link} to={`/user-profile/${userID}/balance`}>
          <IconButton><BalanceIcon/></IconButton>
        </Button>
        <Button variant="outlined" color="inherit" component={Link} to={`/user-profile/${userID}/operation`}>
          <IconButton><PriceChangeIcon/></IconButton>
        </Button>
        <Button variant="outlined" color="inherit" component={Link} to={`/user-profile/${userID}/history`}>
          <IconButton><AccountBalanceWalletIcon/></IconButton>
        </Button>
        <Button variant="outlined" color="inherit" component={Link} to={`/user-profile/${userID}/graph`}>
          <IconButton><StackedBarChartIcon/></IconButton>
        </Button>
        <Button variant="outlined" color="inherit" onClick = {logOut} component={Link} to={`/`}>
          <IconButton><ExitToAppIcon/></IconButton>
        </Button>
      </ButtonGroup>
    )
  );
 
}

export default NavigationBar;