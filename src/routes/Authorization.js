import {auth, googleAuthProvider} from "../config/firebase";
import {signInWithEmailAndPassword, signInWithPopup} from "firebase/auth";
import {Link, useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Logo} from "../components/Logo/Logo";
import {useAuthorizationAndRegistration} from "../hooks/useAuthorizationAndRegistration";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {ErrorMessages} from "../components/Error/ErrorMesseges";
import {observer} from "mobx-react";
import AuthStore from "../Stores/AuthStore";

export const Authorization = observer(() => {
    const {
        email,
        setEmail,
        password,
        setPassword,
        error,
        setError
    } = useAuthorizationAndRegistration();
    const navigate = useNavigate();
    const isScreenSmall = useMediaQuery("(max-height: 400px)");
    const isScreenWide = useMediaQuery("(min-width: 600px)");

    const signIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const userId = auth.currentUser.uid;
            AuthStore.setCurrentUserID(userId);
            AuthStore.setCurrentUser(auth.currentUser);
            navigate(`/user-profile/${userId}`);
        }
        catch (error) {
            console.log(error);
            const errorMsg = ErrorMessages[error.code] || "An error occurred while logging in";
            setError(errorMsg);
        }
    };

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleAuthProvider);
            const userId = auth.currentUser.uid;
            AuthStore.setCurrentUserID(userId);
            AuthStore.setCurrentUser(auth.currentUser);
            navigate(`/user-profile/${userId}`);
        }
        catch (error) {
            console.log(error);
            const errorMsg = ErrorMessages[error.code] || "An error occurred while logging in";
            setError(errorMsg);
        }
    };

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%"
            }}>
                <Typography align = "center" variant = "h6">
                    WELCOME TO
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
                    Sign in to your account
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-evenly",
                width: "90%",
                py: 1,
                gap: 1
            }}>
                <TextField label = "Email" type = "email" sx = {{width: isScreenWide ? "20%" : "100%"}}
                           onChange = {(e) => setEmail(e.target.value)}
                           onKeyDown = {(e) => {
                               if (e.key === "Enter") {
                                   signIn();
                               }
                           }}
                />
                <TextField label = "Password" type = "password" sx = {{width: isScreenWide ? "20%" : "100%"}}
                           onChange = {(e) => setPassword(e.target.value)}
                           onKeyDown = {(e) => {
                               if (e.key === "Enter") {
                                   signIn();
                               }
                           }}
                />
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: isScreenSmall ? "row" : "column",
                alignItems: "center",
                justifyContent: "space-evenly",
                width: "75%"
            }}>
                <Button onClick = {signIn}>Sign In</Button>
                <Button onClick = {signInWithGoogle}>Sign In With Google</Button>
                {!isScreenSmall && (
                    <Typography align = "center" variant = "overline">
                        Don't have an account yet?
                    </Typography>
                )}
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "/registration">
                        Registration
                    </Link>
                </Button>
            </Box>

            {error && (
                <ErrorDialog open = {true} onClose = {() => setError(null)} error = {error}/>
            )}
        </Box>
    );
});
