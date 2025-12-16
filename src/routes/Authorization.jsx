import {auth, googleAuthProvider, isFirebaseConfigured} from "../config/firebase";
import {signInWithEmailAndPassword, signInWithPopup} from "firebase/auth";
import {Link, useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import Alert from "@mui/material/Alert";
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
    const isSmallHeightScreen = useMediaQuery("(max-height: 500px)");
    const isSmallWidthScreen = useMediaQuery("(max-width: 500px)");
    const isMediumWidthScreen = useMediaQuery("(min-width: 501px) and (max-width: 700px)");

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

    const getInputWidth = () => {
        if (isSmallWidthScreen) {
            return "90%";
        } else if (isMediumWidthScreen) {
            return "65%";
        } else {
            return "50%";
        }
    };

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            height: "100%"
        }}>
            {!isFirebaseConfigured && (
                <Alert severity="warning" sx={{ m: 2, maxWidth: "600px" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Firebase Not Configured
                    </Typography>
                    <Typography variant="body2">
                        Please create a <code>.env.local</code> file with your Firebase credentials.
                        Run <code>node scripts/setup-env.js</code> to create a template.
                    </Typography>
                </Alert>
            )}
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%"
            }}>
                <Typography align = "center" variant = "h6">
                    WELCOME TO
                    <Logo style={{width:"300px"}} />
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%",
                gap: 1
            }}>
                <Typography align = "center" variant = "h6">
                    Sign in to your account
                </Typography>
                <TextField label = "Email" type = "email" sx = {{width: getInputWidth(), backgroundColor:"White"}}
                           onChange = {(e) => setEmail(e.target.value)}
                           onKeyDown = {(e) => {
                               if (e.key === "Enter") {
                                   signIn();
                               }
                           }}
                />
                <TextField label = "Password" type = "password" sx = {{width: getInputWidth(), backgroundColor:"White"}}
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
                flexDirection: isSmallHeightScreen ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                width: "90%",
                gap: 1
            }}>
                <Button variant = "contained" sx = {{width: "200px"}}
                        onClick = {signIn}>Sign In</Button>
                <Button variant = "contained" sx = {{width: "200px"}}
                        onClick = {signInWithGoogle}>Sign In With Google</Button>
                {!isSmallHeightScreen && (
                    <Typography align = "center" variant = "overline" sx = {{pt: 3}}>
                        Don't have an account yet?
                    </Typography>
                )}
                <Button variant = "contained" sx = {{width: "200px"}}>
                    <Link style = {{textDecoration: "none", color: "rgb(236, 240, 241)"}} to = "/registration">
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
