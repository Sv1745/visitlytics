import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyDgM8fvSjEhQ_ddUU9Pv32ZW3D23nXNsJA",
    authDomain: "visitlytics.firebaseapp.com",
    projectId: "visitlytics",
    storageBucket: "visitlytics.firebasestorage.app",
    messagingSenderId: "1026242724817",
    appId: "1:1026242724817:web:2f408c6ad34c2548fad6f0",
    measurementId: "G-5LP5HTPEJS"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 