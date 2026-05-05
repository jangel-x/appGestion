import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLo_zqghdbC9Bjz0bXKHRNzDkITyASDPE",
  authDomain: "agenda-equipo.firebaseapp.com",
  projectId: "agenda-equipo",
  storageBucket: "agenda-equipo.firebasestorage.app",
  messagingSenderId: "255128018087",
  appId: "1:255128018087:web:06db8b81e92310be58cf82"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
