import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {createUserWithEmailAndPassword} from "firebase/auth";
import AuthStore from "../Stores/AuthStore";
import {auth} from "../config/firebase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Logo} from "../components/Logo/Logo";
import {ErrorMessages} from "../components/Error/ErrorMesseges";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {SuccessRegistrationDialog} from "../components/Error/SuccessRegistrationDialog";
import {useAuthorizationAndRegistration} from "../hooks/useAuthorizationAndRegistration";
import {useUsers} from "../hooks/useUsers";

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
    const isSmallHeightScreen = useMediaQuery("(max-height: 433px)");
    const isMediumHeightScreen = useMediaQuery("(min-height: 433px) and (max-height: 555px)");
    const isSmallWidthScreen = useMediaQuery("(max-width: 500px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 501px) and (max-width: 700px)");

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
            const errorMsg = ErrorMessages[error.code] || "An error occurred while registering in the system";
            setError(errorMsg);
        }
    };

    const handleCloseSuccessDialog = () => {
        setRegistrationSuccess(false);
        navigate(`/user-profile/${userId}`);
    };

    const getInputWidth = () => {
        if (isSmallWidthScreen) {
            return "90%";
        } else if (isMediumWidthScreen) {
            return "50%";
        } else {
            return "40%";
        }
    };

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
            height: "100%",
            minHeight:"300px"
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
                    <Logo style={{width:"300px"}} />
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                gap: 1
            }}>
                {!isSmallHeightScreen && (
                    <Typography align = "center" variant = "h6">
                    Let's get acquainted
                </Typography>)}
                <Box sx = {{
                    display: "flex",
                    flexDirection: isSmallHeightScreen || isMediumHeightScreen? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "90%",
                    gap: 1
                }}>
                    <TextField label = "Name" type = "text"
                               sx = {{width: getInputWidth(), backgroundColor:"white"}}
                               onChange = {(e) => setName(e.target.value)}
                               onKeyDown = {(e) => {
                                   if (e.key === "Enter") {
                                       registration();
                                   }
                               }}
                    />
                    <TextField label = "Email" type = "email"
                               sx = {{width: getInputWidth(), backgroundColor:"white"}}
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
                    flexDirection: isSmallHeightScreen || isMediumHeightScreen? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "90%",
                    gap: 1
                }}>
                    <TextField label = "Password" type = "password"
                               sx = {{width: getInputWidth(), backgroundColor:"white"}}
                               onChange = {(e) => setPassword(e.target.value)}
                               onKeyDown = {(e) => {
                                   if (e.key === "Enter") {
                                       registration();
                                   }
                               }}
                    />
                    <TextField label = "Confirm Password" type = "password"
                               sx = {{width: getInputWidth(), backgroundColor:"white"}}
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
                flexDirection: isSmallHeightScreen ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                width: "75%"
            }}>
                <Button type = "submit" variant = "contained" sx = {{width: "200px"}}
                        onClick = {registration}>Register</Button>
                {!isSmallHeightScreen && (
                    <Typography align = "center" variant = "overline" sx = {{pt: 3}}>
                        Already have an account?
                    </Typography>
                )}
                <Button variant = "contained" sx = {{width: "200px"}}>
                    <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}} to = "/">Sign in</Link>
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
