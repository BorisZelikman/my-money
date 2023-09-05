import {useState} from "react";

export const useAuthState = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    return {email, setEmail, password, setPassword, error, setError};
};
