// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI5sjZtR6OixVa_HOaxmkaOvMqtokrHR0",
  authDomain: "mahamitra-shop.firebaseapp.com",
  projectId: "mahamitra-shop",
  storageBucket: "mahamitra-shop.firebasestorage.app",
  messagingSenderId: "276126772096",
  appId: "1:276126772096:web:1ef21c31e59e87b9d86f65",
  measurementId: "G-YJKBW9X3PY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
