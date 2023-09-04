import {auth, googleAuthProvider} from "../config/firebase";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup} from "firebase/auth";
import {useState} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Logo} from "./Logo";
import Typography from "@mui/material/Typography";

export const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const registration = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log(auth.currentUser);
        }
        catch (err) {
            console.error(err);
        }
    };

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
            console.log(auth.currentUser.uid);
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {2}>
                <Logo/>
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
                <Button onClick = {registration}>Registration</Button>
            </Stack>
        </Box>
    );
};
