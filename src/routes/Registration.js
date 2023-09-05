import React, {useState} from "react";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Link, useNavigate} from "react-router-dom";
import {Logo} from "../components/Logo/Logo";
import {useAuthState} from "../hooks/useAuthState";
import {ErrorMessages} from "../components/Error/ErrorMesseges";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {SuccessDialog} from "../components/Error/SuccessDialog";

export const Registration = () => {
    const navigate = useNavigate();
    const {email, setEmail, password, setPassword, error, setError} = useAuthState();
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userId, setUserId] = useState(null);

    const registration = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            const userId = auth.currentUser.uid;

            setRegistrationSuccess(true);
            setUserId(userId);
        }
        catch (error) {
            console.log(error);
            const errorMsg = ErrorMessages[error.code] || "An error occurred while registering in the system";

            setError(errorMsg);
        }
    };

    const handleCloseSuccessDialog = () => {
        setRegistrationSuccess(false);
        navigate(`/user-profile/${userId}`);
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

            {registrationSuccess && (
                <SuccessDialog open = {registrationSuccess} onClose = {handleCloseSuccessDialog}/>
            )}

            {error && (
                <ErrorDialog open = {true} onClose = {() => setError(null)} error = {error}/>
            )}
        </Box>
    );
};
