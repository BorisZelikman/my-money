import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables (Vite)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase config is properly set
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

let app = null;
let auth = null;
let googleAuthProvider = null;
let db = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleAuthProvider = new GoogleAuthProvider();
        db = getFirestore(app);
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
} else {
    console.warn('Firebase is not configured. Please set up your .env.local file with Firebase credentials.');
    console.warn('Copy .env.example to .env.local and fill in your Firebase project values.');
}

export { auth, googleAuthProvider, db, isFirebaseConfigured };
