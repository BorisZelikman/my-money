import "./App.css";
import {Auth} from "./components/Auth";
import Box from "@mui/material/Box";

function App() {
    return (
        <Box sx = {{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh"
        }}>
            <Auth/>
        </Box>
    );
}

export default App;
