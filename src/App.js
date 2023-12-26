import "./App.css";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
import {Registration} from "./routes/Registration";
import {Authorization} from "./routes/Authorization";
import {UserProfile} from "./routes/UserProfile";
import {Operations} from "./routes/Operations";
import {History} from "./components/Items/History";
import {Graph} from "./components/Items/Graph";
import {CurrencyConverter} from "./components/Items/CurrencyConverter";
import {NavigationBar} from "./components/Items/NavigationBar";
import AuthStore from "./Stores/AuthStore";
import {Provider} from "mobx-react";
import screenfull from 'screenfull';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import {Backdrop} from "@mui/material";
import {Logo} from "./components/Logo/Logo";
import {useEffect, useState} from "react";

export const App = () => {
    const [backdropShow, setBackdropShow] = useState(false);
    useEffect(() => {
            console.log (backdropShow)
    }, [backdropShow]);

    return (
        <Provider AuthStore = {AuthStore}>
            <Router>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box className="main-box-container">
                        <Box className="pages-container"
                             onDoubleClick={(e)=>screenfull.toggle()}
                        >
                            <Routes>
                                <Route path = "/" element = {
                                    <Authorization onProcess={(state)=>setBackdropShow(state)}/>
                                }/>
                                <Route path = "/registration" element = {<Registration/>}/>
                                <Route path = "/user-profile" element = {
                                    <UserProfile onProcess={(state)=>setBackdropShow(state)}/>
                                }/>
                                <Route path = "/operations" element = {
                                    <Operations onProcess={(state)=>setBackdropShow(state)}/>
                                }/>
                                <Route path = "/graph" element = {<Graph/>}/>
                                <Route path = "/history" element = {
                                    <History onProcess={(state)=>{setBackdropShow(state); console.log("H", state)}}/>
                                }/>
                                <Route path = "/converter" element = {<CurrencyConverter/>}/>
                            </Routes>
                        </Box>
                        <Box className="navbar-container">
                            <NavigationBar />
                        </Box>
                    </Box>
                    <Backdrop open={backdropShow} sx={{backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex:1000}}>

                        {/*<CircularProgress color="inherit" />*/}
                        <Logo style={{ color:"orange"}} isBig={true}/>
                    </Backdrop>
                </LocalizationProvider>
            </Router>
        </Provider>
    );
};
