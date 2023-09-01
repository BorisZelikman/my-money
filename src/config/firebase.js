import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyAER4YlW1J9DiTXEATr9aTnkQdK4TGFf68",
  authDomain: "my-money-1d617.firebaseapp.com",
  projectId: "my-money-1d617",
  storageBucket: "my-money-1d617.appspot.com",
  messagingSenderId: "989105357376",
  appId: "1:989105357376:web:01df465df3875f857d55a5",
  measurementId: "G-2PX2F7JL3T",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
