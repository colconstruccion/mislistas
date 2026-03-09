import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

function $(id){ return document.getElementById(id); }
function setStatus(msg){ const el = $("statusBox"); if (el) el.textContent = msg || ""; }

// ✅ PUT YOUR REAL CONFIG HERE:

const firebaseConfig = {
  apiKey: "AIzaSyBLGPdKkyYVwIA1-5QZTIBkoOznNgLIW6I",
  authDomain: "quick-lysty.firebaseapp.com",
  projectId: "quick-lysty",
  storageBucket: "quick-lysty.firebasestorage.app",
  messagingSenderId: "5584828638",
  appId: "1:5584828638:web:4e4a4c2d2b3e2a4f52aa4f",
  measurementId: "G-LRWMK06XZK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app); // if you use a region, we’ll set it here

async function loadStats(){
  setStatus("Fetching admin stats…");

  try {
    const fn = httpsCallable(functions, "getAdminStats");
    const res = await fn();
    const d = res.data || {};

    function fmt(n){
      if(n === undefined || n === null) return "—";
      return Number(n).toLocaleString();
    }

    $("usersCount").textContent      = fmt(d.users);
    $("publicDocsCount").textContent = fmt(d.publicDocuments);
    $("listsCount").textContent      = fmt(d.lists);
    $("userDocsCount").textContent   = fmt(d.userDocuments);

    setStatus("Updated just now.");
  } catch (err) {
    console.error(err);
    if (err.code === "permission-denied") {
      location.href = "/auth.html";
      return;
    }

    setStatus(`Error: ${err?.message || err}`);
    $("usersCount").textContent = "—";
    $("publicDocsCount").textContent = "—";
    $("listsCount").textContent = "—";
    $("userDocsCount").textContent = "—";
  }
}

function wireUI(){
  $("refreshBtn").onclick = loadStats;
  $("logoutBtn").onclick = async () => {
    await signOut(auth);
    location.href = "./login.html";
  };
}

wireUI();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "./login.html";
    return;
  }

  $("adminEmail").textContent = user.email || "Logged in";
  await loadStats();
});