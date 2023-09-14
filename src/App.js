import "./App.css";
import {useEffect, useState} from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
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
    const [userID, setUserID] = useState();

    useEffect(() => {
        setUserID(AuthStore.currentUserID);
    }, []);

    return (
        <Provider AuthStore={AuthStore}>
            <Router>
                <Box sx = {{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh"
                }}>
                    <Routes>
                        <Route path = "/" element = {<Authorization />}></Route>
                        <Route path = "/registration" element = {<Registration />}/>
                        <Route path = "/user-profile/:userId" element = {<UserProfile/>}/>
                        <Route path = "/user-profile/:userId/balance" element = {<Balance/>}/>
                        <Route path = "/user-profile/:userId/operations" element = {<Operations/>}/>
                        <Route path = "/user-profile/:userId/graph" element = {<Graph/>}/>
                        <Route path = "/user-profile/:userId/history" element = {<History/>}/>
                        <Route path = "/user-profile/:userId/add_asset" element = {<AddAsset/>}/>
                    </Routes>
                    <NavigationBar userID = {userID}/>
                </Box>
            </Router>
        </Provider>
    );
};
