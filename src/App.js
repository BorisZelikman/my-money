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

export const App = () => {
    const [userId, setUserId] = useState();
    const isSmallHeightScreen = useMediaQuery("(max-height: 401px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 701px)");
    const isLargeWidthScreen = useMediaQuery("(min-width: 801px)");

    useEffect(() => {
        setUserId(AuthStore.currentUserID);
    }, []);

    const currentPath = window.location.pathname;
    const isRegistrationOrAuthorization = currentPath === "/" || currentPath === "/registration";

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
                    left: 0
                }}>
                    <Box sx = {{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: isRegistrationOrAuthorization ? "100%" : (isLargeWidthScreen ? "80%" : "100%"),
                        height: "100%",
                        overflowY: "auto",
                        position: "relative"
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
                        </Routes>
                    </Box>
                    <Box sx = {{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        width: isRegistrationOrAuthorization ? "" : (isLargeWidthScreen ? "20%" : (isSmallHeightScreen ? "auto" : "100%"))
                    }}>
                        <NavigationBar userID = {userId}/>
                    </Box>
                </Box>
            </Router>
        </Provider>
    );
};
