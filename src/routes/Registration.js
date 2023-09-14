import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Logo} from "../components/Logo/Logo";
import {ErrorMessages} from "../components/Error/ErrorMesseges";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {SuccessRegistrationDialog} from "../components/Error/SuccessRegistrationDialog";
import {useAuthorizationAndRegistration} from "../hooks/useAuthorizationAndRegistration";
import {useUsers} from "../hooks/useUsers";
import useMediaQuery from "@mui/material/useMediaQuery";
import AuthStore from "../Stores/AuthStore";

export const Registration = () => {
    const navigate = useNavigate();
    const {
        name,
        setName,
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
    const {addUser} = useUsers();
    const isScreenSmall = useMediaQuery("(max-height: 425px)");

    const registration = async (event) => {
        event.preventDefault();

        if (!validatePassword(password, confirmPassword)) {
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            const userId = auth.currentUser.uid;
            AuthStore.setCurrentUserID(userId);
            AuthStore.setCurrentUser(auth.currentUser);
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
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            height: "100%"
        }}
        >
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%"
            }}>
                <Typography align = "center" variant = "h6">
                    REGISTRATION IN
                    <Logo/>
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%"
            }}>
                <Typography align = "center" variant = "h6">
                    Let's get acquainted
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                gap: 1
            }}>
                <Box sx = {{
                    display: "flex",
                    flexDirection: isScreenSmall ? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "90%",
                    gap: 1
                }}>
                    <TextField label = "Name" type = "text" sx = {{width: "100%"}}
                               onChange = {(e) => setName(e.target.value)}
                               onKeyDown = {(e) => {
                                   if (e.key === "Enter") {
                                       registration();
                                   }
                               }}
                    />
                    <TextField label = "Email" type = "email" sx = {{width: "100%"}}
                               onChange = {(e) => setEmail(e.target.value)}
                               onKeyDown = {(e) => {
                                   if (e.key === "Enter") {
                                       registration();
                                   }
                               }}
                    />
                </Box>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "90%",
                    gap: 1
                }}>
                    <TextField label = "Password" type = "password" sx = {{width: "100%"}}
                               onChange = {(e) => setPassword(e.target.value)}
                               onKeyDown = {(e) => {
                                   if (e.key === "Enter") {
                                       registration();
                                   }
                               }}
                    />
                    <TextField label = "Confirm Password" type = "password" sx = {{width: "100%"}}
                               onChange = {(e) => setConfirmPassword(e.target.value)}
                               onKeyDown = {(e) => {
                                   if (e.key === "Enter") {
                                       registration();
                                   }
                               }}
                    />
                </Box>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: isScreenSmall ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                width: "75%"
            }}>
                <Button type = "submit" onClick = {registration}>Register</Button>
                {!isScreenSmall && (
                    <Typography align = "center" variant = "overline">
                        Already have an account?
                    </Typography>
                )}
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "/">Sign in</Link>
                </Button>
            </Box>

            {registrationSuccess && (
                <SuccessRegistrationDialog open = {registrationSuccess} onClose = {handleCloseSuccessDialog}/>
            )}

            {error && (
                <ErrorDialog open = {true} onClose = {() => setError(null)} error = {error}/>
            )}
        </Box>
    );
};
