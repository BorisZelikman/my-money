import {Link, useNavigate} from "react-router-dom";
import {auth, googleAuthProvider} from "../config/firebase";
import {signInWithEmailAndPassword, signInWithPopup} from "firebase/auth";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Logo} from "../components/Logo/Logo";
import Typography from "@mui/material/Typography";
import {useAuthorizationAndRegistration} from "../hooks/useAuthorizationAndRegistration";
import {ErrorDialog} from "../components/Error/ErrorDialog";
import {ErrorMessages} from "../components/Error/ErrorMesseges";

export const Authorization = ({setUser}) => {
    const {email, setEmail, password, setPassword, error, setError} = useAuthorizationAndRegistration();
    const navigate = useNavigate();

    const signIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const userId = auth.currentUser.uid;
            setUser(userId);
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
            setUser(userId);
            navigate(`/user-profile/${userId}`);
        }
        catch (error) {
            console.log(error);
            const errorMsg = ErrorMessages[error.code] || "An error occurred while logging in";
            setError(errorMsg);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Typography align = "center" variant = "h6">
                    WELCOME TO
                    <Logo/>
                </Typography>
                <TextField label = "Email" type = "email"
                           onChange = {(e) => setEmail(e.target.value)}
                />
                <TextField label = "Password" type = "password"
                           onChange = {(e) => setPassword(e.target.value)}
                />
                <Button onClick = {signIn}>Sign In</Button>
                <Button onClick = {signInWithGoogle}>Sign In With Google</Button>
                <Typography align = "center" variant = "overline">
                    Don't have an account yet?
                </Typography>
                <Button>
                    <Link style = {{textDecoration: "none"}} to = "/registration">Registration</Link>
                </Button>
            </Stack>

            {error && (
                <ErrorDialog open = {true} onClose = {() => setError(null)} error = {error}/>
            )}
        </Box>
    );
};
