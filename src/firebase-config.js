// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// ...existing code...
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// ...existing code...

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB2A99ojqoUlLjD-tBJLx1vF320CfTzmw",
  authDomain: "subscription-management-65360.firebaseapp.com",
  projectId: "subscription-management-65360",
  storageBucket: "subscription-management-65360.firebasestorage.app",
  messagingSenderId: "461111495497",
  appId: "1:461111495497:web:de6665464e1ebad5ae2898"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
export const googleProvider = new GoogleAuthProvider();

