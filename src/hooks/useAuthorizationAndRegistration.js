import {useState} from "react";

export const useAuthorizationAndRegistration = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const validatePassword = (password, confirmPassword) => {
        if (password !== confirmPassword) {
            setError("Confirmation doesn't match password")
            return false
        }

        setError(null)
        return true;
    }

    return {email, setEmail, password, setPassword, error, setError, validatePassword};
};
