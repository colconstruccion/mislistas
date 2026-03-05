// firebaseConfig.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// Your project keys
const firebaseConfig = {
  apiKey: "AIzaSyBLGPdKkyYVwIA1-5QZTIBkoOznNgLIW6I",
  authDomain: "quick-lysty.firebaseapp.com",
  projectId: "quick-lysty",
  storageBucket: "quick-lysty.firebasestorage.app",
  messagingSenderId: "5584828638",
  appId: "1:5584828638:web:4e4a4c2d2b3e2a4f52aa4f",
  measurementId: "G-LRWMK06XZK"
};

// Safe single init
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export initialized instances
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Expose initialized SDK to other scripts
window._firebase = { app, auth, db, storage };

// (Nice to have) signal readiness for defensive loaders
window.dispatchEvent(new Event("firebase-ready"));

// Exports
export { app, auth, db, storage, firebaseConfig };

