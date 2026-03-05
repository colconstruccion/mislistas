// billing.js
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const { app, auth } = window._firebase;

const functions = getFunctions(app);
const db = getFirestore(app);

const createPointsCheckoutSession = httpsCallable(functions, "createPointsCheckoutSession");

// 1) Expose global for inline onclick
window.buyPoints100 = async function () {
  try {
    const res = await createPointsCheckoutSession({
      successUrl: `${location.origin}/auth.html?buyPoints=success`,
      cancelUrl: `${location.origin}/auth.html?buyPoints=cancel`,
    });

    const url = res?.data?.url;
    if (!url) throw new Error("No checkout URL returned.");
    location.href = url;
  } catch (err) {
    console.error("buyPoints100 failed:", err);
    alert(err?.message || "Could not start checkout.");
  }
};

// 2) Live points + plan UI
function wireBillingUI(user) {
  const planEl = document.getElementById("planLabel");
  const pointsEl = document.getElementById("pointsLabel");
  if (!planEl || !pointsEl) return;

  const userRef = doc(db, "users", user.uid);

  return onSnapshot(userRef, (snap) => {
    const data = snap.data() || {};
    planEl.textContent = data.plan || "free";
    pointsEl.textContent = Number.isFinite(data.pointsBalance) ? String(data.pointsBalance) : "0";
  });
}

// 3) Toast on return from Stripe success/cancel + clean URL
function showCheckoutToastIfNeeded() {
  const qp = new URLSearchParams(location.search);
  const status = qp.get("buyPoints");

  if (status === "success") {
    if (typeof window.showToast === "function") window.showToast("✅ Payment successful — points added!");
    qp.delete("buyPoints");
    history.replaceState({}, "", location.pathname + (qp.toString() ? `?${qp}` : "") + location.hash);
  }

  if (status === "cancel") {
    if (typeof window.showToast === "function") window.showToast("Payment cancelled.");
    qp.delete("buyPoints");
    history.replaceState({}, "", location.pathname + (qp.toString() ? `?${qp}` : "") + location.hash);
  }
}

// 4) Init once user is signed in
auth.onAuthStateChanged((user) => {
  if (!user) return;
  wireBillingUI(user);
  showCheckoutToastIfNeeded();
});