import "./App.css";
import {Auth} from "./routes/Auth";
import Box from "@mui/material/Box";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import {Registration} from "./routes/Registration";
import {UserProfile} from "./routes/UserProfile";
import Balance from "./components/Items/Balance";
import {AddAsset} from "./components/Items/AddAsset";

export const App = () => {
    return (
        <Router>
            <Box sx = {{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh"
            }}>
                <Routes>
                    <Route path = "/" element = {<Auth/>}></Route>
                    <Route path = "/registration" element = {<Registration/>}/>
                    <Route path = "/user-profile/:userId" element = {<UserProfile/>}/>
                    <Route path = "/user-profile/:userId/balance" element = {<Balance/>}/>
                    <Route path = "/user-profile/:userId/balance/add" element = {<AddAsset/>}/>
                </Routes>
            </Box>
        </Router>
    );
};
