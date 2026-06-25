import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

function $(id) {
  return document.getElementById(id);
}

function setMsg(el, text) {
  if (el) el.textContent = text || "";
}

function getAuthSafe() {
  return window._firebase?.auth || null;
}

function getAppSafe() {
  return window._firebase?.app || null;
}

function wireAccountPanel(auth, app, user) {
  const accountEmailEl = $("accountEmail");
  const accountMsgEl = $("accountMsg");
  const accountChangeBtn = $("accountChangePasswordBtn");
  const accountDeleteBtn = $("accountDeleteBtn");

  if (accountEmailEl) accountEmailEl.textContent = user.email ?? "";

  if (accountChangeBtn) {
    accountChangeBtn.onclick = async () => {
      try {
        await sendPasswordResetEmail(auth, user.email);
        setMsg(accountMsgEl, "We sent a secure password reset link to your email.");
      } catch (err) {
        console.error(err);
        setMsg(accountMsgEl, err?.message || "Could not send reset email.");
      }
    };
  }

  if (accountDeleteBtn) {
    accountDeleteBtn.onclick = async () => {
      const ok = confirm(
        "This will permanently delete your account AND all your lists/documents. Continue?"
      );
      if (!ok) return;

      try {
        // ✅ Immediately show feedback and prevent double clicks
        accountDeleteBtn.disabled = true;
        setMsg(accountMsgEl, "Deleting your account and data…");

        // ✅ Call your deployed callable function
        const fn = httpsCallable(getFunctions(app), "deleteAccountData");
        await fn();

        // ✅ Ensure the user is signed out locally
        await signOut(auth);

        // ✅ Redirect
        window.location.href = "index.html";
      } catch (err) {
        console.error(err);
        setMsg(
          accountMsgEl,
          err?.message || "Delete failed. Check console for details."
        );
        accountDeleteBtn.disabled = false;
      }
    };
  }
}

function initAccountPanel() {
  const auth = getAuthSafe();
  const app = getAppSafe();

  if (!auth || !app) {
    setTimeout(initAccountPanel, 200);
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    wireAccountPanel(auth, app, user);
    await updateAvatarPlan(auth, app, user);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAccountPanel);
} else {
  initAccountPanel();
}

async function updateAvatarPlan(auth, app, user) {
  const tooltip = document.getElementById("avatarPlanTooltip");
  if (!tooltip) return;

  try {
    // 🔥 Get admin claim
    const tokenResult = await user.getIdTokenResult(true);
    const isAdmin = tokenResult.claims.admin === true;

    // 🔥 Get plan from Firestore
    const db = window._firebase?.db;
    if (!db) return;

    const { doc, getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
    );

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};

    const plan = data.plan || "free";

    // 🔥 Decide label
    let label = "FREE";

    if (plan === "paid") {
      label = "PAID";
    }

    if (isAdmin) {
      label = "ADMIN";
    }

    tooltip.textContent = label;

    // optional color classes
    tooltip.className = "avatar-tooltip " + label.toLowerCase();

  } catch (err) {
    console.error("updateAvatarPlan error:", err);
  }
}