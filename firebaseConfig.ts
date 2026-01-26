import { initializeApp } from "firebase/app";
// Initialize and export auth using standard modular SDK syntax
// Fix: Ensure modular getAuth is correctly imported from firebase/auth
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzmo0DDohEltHNPUM24GmoHb9IC-ubS-k",
  authDomain: "flash-third-party-app.firebaseapp.com",
  projectId: "flash-third-party-app",
  storageBucket: "flash-third-party-app.firebasestorage.app",
  messagingSenderId: "280892616112",
  appId: "1:280892616112:web:b5b6acdb8679b9aed0fa75",
  measurementId: "G-19BL49G3QL"
};

const app = initializeApp(firebaseConfig);
// Initialize and export auth using modular getAuth
export const auth = getAuth(app);
// Initialize and export Firestore
export const db = getFirestore(app);