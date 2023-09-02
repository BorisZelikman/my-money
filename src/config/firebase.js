import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import apiKey from "./firebase-config.json";
import authDomain from "./firebase-config.json";
import projectId from "./firebase-config.json";
import storageBucket from "./firebase-config.json";
import messagingSenderId from "./firebase-config.json";
import appId from "./firebase-config.json";
import measurementId from "./firebase-config.json";

const firebaseConfig = {
  apiKey: `${apiKey.apiKey}`,
  authDomain: `${authDomain.authDomain}`,
  projectId: `${projectId.projectId}`,
  storageBucket: `${storageBucket.storageBucket}`,
  messagingSenderId: `${messagingSenderId.messagingSenderId}`,
  appId: `${appId.appId}`,
  measurementId: `${measurementId.measurementId}`,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
