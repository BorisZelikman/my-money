import {auth, googleAuthProvider} from "../config/firebase";
import {createUserWithEmailAndPassword, signInWithPopup, signOut} from "firebase/auth";
import {useState} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {Logo} from "./Logo";

export const Auth = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    console.log(auth.currentUser);

    const signIn = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        catch (err) {
            console.error(err);
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

    const logOut = async () => {
        try {
            await signOut(auth);
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx = {{display: "flex", justifyContent: "center"}}>
            <Stack spacing = {3}>
                <Logo/>
                <TextField label = "Email" type = "email"
                           onChange = {(e) => setEmail(e.target.value)}
                />
                <TextField label = "Password" type = "password"
                           onChange = {(e) => setPassword(e.target.value)}
                />
                <Button onClick = {signIn}>Sign In</Button>
                <Button onClick = {signInWithGoogle}>Sign In With Google</Button>
                <Button onClick = {logOut}>Sign Out</Button>
            </Stack>
        </Box>
    );
};
