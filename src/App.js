import "./App.css";
import {Auth} from "./routes/Auth";
import Box from "@mui/material/Box";
import {BrowserRouter as Router, Route, Routes } from "react-router-dom";
import React, {useState} from "react";
import {Registration} from "./routes/Registration";
import {UserProfile} from "./routes/UserProfile";
import Balance from "./components/Items/Balance";
import {AddAsset} from "./components/Items/AddAsset";
import { UserProvider } from './data/UserContext'; 
import NavigationBar from "./components/Items/NavigationBar";


export const App = () => {
    const [userID, setUserID] = useState();

    const setUser = function(userID) {
        setUserID(userID)

    }
    return (
        <Router>
            <UserProvider>
                <Box sx = {{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh"
                }}>
                    <Routes>
                        <Route path = "/" element = {<Auth setUser = {setUser}/>}></Route>
                        <Route path = "/registration" element = {<Registration setUser = {setUser}/>}/>
                        <Route path = "/user-profile/:userId" element = {<UserProfile/>}/>
                        <Route path = "/user-profile/:userId/balance" element = {<Balance/>}/>
                        <Route path = "/user-profile/:userId/balance/add" element = {<AddAsset/>}/>
                    </Routes>
                </Box>
                <NavigationBar userID = {userID}/>
            </UserProvider>
        </Router>
    );
};
