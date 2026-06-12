import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkFBDVQP7wSg4IwUQa-rBZxsQCFU-erVA",
  authDomain: "zenxchat-2f75b.firebaseapp.com",
  projectId: "zenxchat-2f75b",
  storageBucket: "zenxchat-2f75b.firebasestorage.app",
  messagingSenderId: "938740410521",
  appId: "1:938740410521:web:ceebc582192f9ebb26b008",
  measurementId: "G-DCRHKF59E3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
