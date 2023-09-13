import React, { useState } from "react";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Link, useNavigate} from "react-router-dom";
import {Logo} from "../components/Logo/Logo";
import {useAuthorizationAndRegistration} from "../hooks/useAuthorizationAndRegistration";
import {ErrorMessages} from "../components/Error/ErrorMesseges";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {SuccessRegistrationDialog} from "../components/Error/SuccessRegistrationDialog";
import {useUsers} from "../hooks/useUsers";

export const Registration = ({ setUser }) => {
    const navigate = useNavigate();
    const {name, setName, email, setEmail, password, setPassword,
        error, setError, validatePassword} = useAuthorizationAndRegistration();
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userId, setUserId] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState("");
    const {addUser}=useUsers();


    const registration = async (event) => {
        event.preventDefault();

        if (!validatePassword(password, confirmPassword)) {
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            const userId = auth.currentUser.uid;
            setUser(userId);
            setRegistrationSuccess(true);
            setUserId(userId);
            addUser(userId, name);
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
                    <TextField label = "Name" type = "text"
                               onChange = {(e) => setName(e.target.value)}
                    />
                    <TextField label = "Email" type = "email"
                               onChange = {(e) => setEmail(e.target.value)}
                    />
                    <TextField label = "Password" type = "password"
                               onChange = {(e) => setPassword(e.target.value)}
                    />
                    <TextField label = "Confirm Password" type = "password"
                               onChange = {(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button type = "submit" onClick = {registration}>Register</Button>
                    <Typography align = "center" variant = "overline">
                        Already have an account?
                    </Typography>
                    <Button>
                        <Link style = {{textDecoration: "none"}} to = "/">Sign in</Link>
                    </Button>
                </Stack>

            {registrationSuccess && (
                <SuccessRegistrationDialog open = {registrationSuccess} onClose = {handleCloseSuccessDialog}/>
            )}

            {error && (
                <ErrorDialog open = {true} onClose = {() => setError(null)} error = {error}/>
            )}
        </Box>
    );
};
