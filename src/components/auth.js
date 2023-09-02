import { auth, googleAuthProvider } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useState } from "react";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  console.log(auth.currentUser);

  const signIn = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div>
        <input
          placeholder="Email..."
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password..."
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={signIn}>Sign In</button>
      </div>
      <button onClick={signInWithGoogle}>Sign In With Google</button>
      <button onClick={logOut}>Sign Out</button>
    </>
  );
};
