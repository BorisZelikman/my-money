import "./App.css";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import {AddAsset} from "./components/Items/Asset/AddAsset";
import {NavigationBar} from "./components/Items/NavigationBar";
import {History} from "./components/Items/History";
import {Graph} from "./components/Items/Graph";
import {Registration} from "./routes/Registration";
import {UserProfile} from "./routes/UserProfile";
import {Operations} from "./routes/Operations";
import {Authorization} from "./routes/Authorization";
import AuthStore from "./Stores/AuthStore";
import {Provider} from "mobx-react";
import {CurrencyConverter} from "./components/Items/CurrencyConverter";
import screenfull from 'screenfull';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

export const App = () => {
    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");

    return (
        <Provider AuthStore = {AuthStore}>
            <Router>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box className="main-box-container"
                         sx = {{
                        flexDirection: isSmallHeightScreen || isMediumWidthScreen ? "row-reverse" : "column",
                        alignItems: isSmallHeightScreen || isMediumWidthScreen ? "flex-start":"center"
                    }}
                    >
                        <Box className="pages-container"
                             onDoubleClick={(e)=>screenfull.toggle()}
                        >
                            <Routes>
                                <Route path = "/" element = {<Authorization/>}/>
                                <Route path = "/registration" element = {<Registration/>}/>
                                <Route path = "/user-profile" element = {<UserProfile/>}/>
                                <Route path = "/operations" element = {<Operations/>}/>
                                <Route path = "/graph" element = {<Graph/>}/>
                                <Route path = "/history" element = {<History/>}/>
                                <Route path = "/add_asset" element = {<AddAsset/>}/>
                                <Route path = "/converter" element = {<CurrencyConverter/>}/>
                            </Routes>
                        </Box>
                        <Box className="navbar-container">
                            <NavigationBar />
                        </Box>
                    </Box>
                </LocalizationProvider>
            </Router>
        </Provider>
    );
};
