import "./App.css";
import {useEffect, useState} from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Balance} from "./components/Items/Balance";
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

export const App = () => {
    const [userId, setUserId] = useState();
    const isSmallHeightScreen = useMediaQuery("(max-height: 400px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");

    useEffect(() => {
        setUserId(AuthStore.currentUserID);
    }, []);

    return (
        <Provider AuthStore = {AuthStore}>
            <Router>
                <Box sx = {{
                    display: "flex",
                    flexDirection: isSmallHeightScreen || isMediumWidthScreen ? "row-reverse" : "column",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // backgroundColor:"#9d4646"
                }}>
                    <Box sx = {{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        height: "100%",
                        overflowY: "auto",
                        // backgroundColor:"#9a9d46"
                    }}>
                        <Routes>
                            <Route path = "/" element = {<Authorization/>}/>
                            <Route path = "/registration" element = {<Registration/>}/>
                            <Route path = "/user-profile/:userId" element = {<UserProfile/>}/>
                            <Route path = "/user-profile/:userId/balance" element = {<Balance/>}/>
                            <Route path = "/user-profile/:userId/operations" element = {<Operations/>}/>
                            <Route path = "/user-profile/:userId/graph" element = {<Graph/>}/>
                            <Route path = "/user-profile/:userId/history" element = {<History/>}/>
                            <Route path = "/user-profile/:userId/add_asset" element = {<AddAsset/>}/>
                            <Route path = "/user-profile/:userId/converter" element = {<CurrencyConverter/>}/>
                        </Routes>
                    </Box>
                    <Box sx = {{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        // backgroundColor:"#464a9d"
                    }}>
                        <NavigationBar userID = {userId}/>
                    </Box>
                </Box>
            </Router>
        </Provider>
    );
};
