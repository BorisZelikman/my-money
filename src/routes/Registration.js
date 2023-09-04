import React from "react";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Link} from "react-router-dom";
import {Logo} from "../components/Logo";
import {useAuthState} from "../hooks/useAuthState";

function Registration() {
    const {email, setEmail, password, setPassword} = useAuthState();

    const registration = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Регистрация успешно завершена");
        }
        catch (err) {
            console.error("Ошибка регистрации:", err);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Typography align = "center" variant = "h6">
                    REGISTRATION IN
                    <Logo/>
                </Typography>
                <TextField label = "Email" type = "email"
                           onChange = {(e) => setEmail(e.target.value)}
                />
                <TextField label = "Password" type = "password"
                           onChange = {(e) => setPassword(e.target.value)}
                />
                <Button onClick = {registration}>Register</Button>
                <Typography align = "center" variant = "overline">
                    Already have an account?
                </Typography>
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "/">Sign in</Link>
                </Button>
            </Stack>
        </Box>
    );
}

export default Registration;
