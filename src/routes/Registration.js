import React, {useState} from "react";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../config/firebase";

function Registration() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const registration = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Registration</h2>
            <div>
                <label>Email:</label>
                <input
                    type = "email"
                    value = {email}
                    onChange = {(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label>Password:</label>
                <input
                    type = "password"
                    value = {password}
                    onChange = {(e) => setPassword(e.target.value)}
                />
            </div>
            <button onClick = {registration}>Register</button>
        </div>
    );
}

export default Registration;
