import "./App.css";
import { Auth } from "./routes/Auth";
import Box from "@mui/material/Box";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Registration } from "./routes/Registration";
import { UserProfile } from "./routes/UserProfile";
import BalanceComponent from "./components/Items/BalanceComponent";
import AddComponent from "./components/Items/AddComponent";
import { Operations } from "./routes/Operations";

export const App = () => {
  return (
    <Router>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Routes>
          <Route path="/" element={<Auth />}></Route>
          <Route path="/registration" element={<Registration />} />
          <Route path="/user-profile/:userId" element={<UserProfile />} />
          <Route path="/operations/:userId" element={<Operations />} />

          <Route path="/balance" element={<BalanceComponent />} />
          <Route path="/add" element={<AddComponent />} />
        </Routes>
      </Box>
    </Router>
  );
};
