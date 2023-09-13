import {useState} from "react";

export const useAuthorizationAndRegistration = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");

    const validatePassword = (password, confirmPassword) => {
        if (password !== confirmPassword) {
            setError("Passwords doesn't match");
            return false;
        }

        setError(null);
        return true;
    };

    return {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        error,
        setError,
        validatePassword,
        registrationSuccess,
        setRegistrationSuccess,
        confirmPassword,
        setConfirmPassword
    };
};
