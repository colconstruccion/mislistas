// googleLogin.js
import {
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function initGoogleLogin() {
  const { auth, db } = window._firebase || {};
  if (!auth || !db) return;

  const showBtn = document.getElementById("showGoogleLoginBox");
  const box = document.getElementById("googleLoginBox");
  const emailInput = document.getElementById("googleLoginEmail");
  const googleBtn = document.getElementById("googleLoginBtn");

  if (!showBtn || !box || !emailInput || !googleBtn) return;

  showBtn.addEventListener("click", () => {
    box.hidden = !box.hidden;
    if (!box.hidden) emailInput.focus();
  });

  googleBtn.addEventListener("click", async () => {
    const emailHint = emailInput.value.trim();

    try {
      const provider = new GoogleAuthProvider();

      if (emailHint) {
        provider.setCustomParameters({
          login_hint: emailHint
        });
      }

      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      // Safety: if the user signed up with Google from login page first.
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: "user",
          plan: "free",
          pointsBalance: 0,
          usage: {
            listCount: 0,
            docCount: 0
          },
          limits: {
            freeLists: 10,
            freeDocs: 10
          },
          costs: {
            listPoints: 10,
            docPoints: 10
          },
          provider: "google",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");

      window.location.href = returnTo || "auth.html";

    } catch (err) {
      alert(err.message || "Google login failed.");
    }
  });
}

if (window._firebase) {
  initGoogleLogin();
} else {
  window.addEventListener("firebase-ready", initGoogleLogin, { once: true });
}