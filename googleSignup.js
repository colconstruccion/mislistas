// googleSignup.js
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

function initGoogleSignup() {
  const { auth, db } = window._firebase || {};
  if (!auth || !db) return;

  const showBtn = document.getElementById("showGoogleSignupBox");
  const box = document.getElementById("googleSignupBox");
  const emailInput = document.getElementById("googleSignupEmail");
  const googleBtn = document.getElementById("googleSignupBtn");

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

      window.location.href = "auth.html";

    } catch (err) {
      alert(err.message || "Google sign up failed.");
    }
  });
}

if (window._firebase) {
  initGoogleSignup();
} else {
  window.addEventListener("firebase-ready", initGoogleSignup, { once: true });
}