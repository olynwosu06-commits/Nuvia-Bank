// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHq6jgBU4vj-SdGXJb2o_pE2te3DJe46Y",
  authDomain: "banking-app-510c8.firebaseapp.com",
  databaseURL: "https://banking-app-510c8-default-rtdb.firebaseio.com",
  projectId: "banking-app-510c8",
  storageBucket: "banking-app-510c8.firebasestorage.app",
  messagingSenderId: "442440417727",
  appId: "1:442440417727:web:610bc432b429000286210a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);   // Firestore

export default app;