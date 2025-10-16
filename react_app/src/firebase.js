// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDkRJPGo7-bzy5tXn4-zoYJMchbcYmpFeg",
  authDomain: "intellita.firebaseapp.com",
  projectId: "intellita",
  storageBucket: "intellita.firebasestorage.app",
  messagingSenderId: "94709963693",
  appId: "1:94709963693:web:859b01204a18796bc3df24",
  measurementId: "G-D09HPWP9DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };