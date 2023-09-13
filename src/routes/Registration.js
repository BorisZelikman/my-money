import {useState} from "react";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../config/firebase";
import {Link, useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Logo} from "../components/Logo/Logo";
import {useAuthorizationAndRegistration} from "../hooks/useAuthorizationAndRegistration";
import {ErrorMessages} from "../components/Error/ErrorMesseges";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {SuccessRegistrationDialog} from "../components/Error/SuccessRegistrationDialog";

export const Registration = ({setUser}) => {
    const navigate = useNavigate();
    const {
        email,
        setEmail,
        password,
        setPassword,
        error,
        setError,
        validatePassword,
        registrationSuccess,
        setRegistrationSuccess,
        confirmPassword,
        setConfirmPassword
    } = useAuthorizationAndRegistration();
    const [userId, setUserId] = useState(null);

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
                           onKeyDown = {(e) => {
                               if (e.key === "Enter") {
                                   registration();
                               }
                           }}
                />
                <TextField label = "Password" type = "password"
                           onChange = {(e) => setPassword(e.target.value)}
                           onKeyDown = {(e) => {
                               if (e.key === "Enter") {
                                   registration();
                               }
                           }}
                />
                <TextField label = "Confirm Password" type = "password"
                           onChange = {(e) => setConfirmPassword(e.target.value)}
                           onKeyDown = {(e) => {
                               if (e.key === "Enter") {
                                   registration();
                               }
                           }}
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
