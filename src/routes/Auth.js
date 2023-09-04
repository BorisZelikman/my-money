import {auth, googleAuthProvider} from "../config/firebase";
import {signInWithEmailAndPassword, signInWithPopup} from "firebase/auth";
import {useState} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Logo} from "../components/Logo";
import Typography from "@mui/material/Typography";
import {Link} from "react-router-dom";

export const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        }
        catch (err) {
            console.log(err);
        }

    };

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleAuthProvider);
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Typography align = "center" variant = "h6">
                    WELCOME IN
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
        </Box>
    );
};
