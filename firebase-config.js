// Import specific functions from Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBE1j7RQEeHAZWhYSUrpfivxOMmru5CTvA",
    authDomain: "sportsbetting-b53b7.firebaseapp.com",
    databaseURL: "https://sportsbetting-b53b7-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sportsbetting-b53b7",
    storageBucket: "sportsbetting-b53b7.firebasestorage.app",
    messagingSenderId: "451849002240",
    appId: "1:451849002240:web:8f9e3463e31c411722e7e5",
    measurementId: "G-FZRD8YN6FE"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, push, set, onValue };

