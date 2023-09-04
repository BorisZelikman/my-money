import "./App.css";
import {Auth} from "./routes/Auth";
import Box from "@mui/material/Box";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Registration from "./routes/Registration";

function App() {
    return (
        <Router>
            <Box sx = {{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh"
            }}>
                <Routes>
                    <Route path = "/" element = {<Auth/>}></Route>
                    <Route path = "/registration" element = {<Registration/>}/>
                </Routes>
            </Box>
        </Router>
    )
        ;
}

export default App;
