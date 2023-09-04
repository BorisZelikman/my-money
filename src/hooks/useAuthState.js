import {useState} from "react";

export const useAuthState = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return {email, setEmail, password, setPassword};
};
