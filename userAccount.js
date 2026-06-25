
  import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

  import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

  const { auth } = window._firebase;
  const db = getFirestore();

  async function ensureUserProfile(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email ?? "",
        displayName: user.displayName ?? "",

        role: "user",
        plan: "free",

        pointsBalance: 0,
        usage: { listCount: 0, docCount: 0 },

        limits: { freeLists: 10, freeDocs: 10 },
        costs: { listPoints: 10, docPoints: 10 },

        companyId: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }


  const protectedEl = document.getElementById('protected');
  const loadingEl = document.getElementById('auth-loading');
  const appLayout = document.getElementById('appLayout');

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    if (!user.emailVerified) {
      await user.reload(); // refresh from server

      if (!user.emailVerified) {
        await signOut(auth);
        window.location.href = "login.html";
        return;
      }
    }


    // ✅ STEP 1B — ensure user profile exists
    await ensureUserProfile(user);
    await loadUserBilling(user);
    //console.log("ensureUserProfile ran for:", user.uid);

    if (loadingEl) loadingEl.remove?.();
    if (protectedEl) protectedEl.hidden = false;
    if (appLayout) appLayout.style.display = '';

    if (typeof window.showDashboardPanel === "function") {
      window.showDashboardPanel();
    }
  });

  async function loadUserBilling(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data() || {};
    const plan = data.plan || "free";
    const points = Number(data.pointsBalance || 0);

    const planLabel = document.getElementById("planLabel");
    const pointsLabel = document.getElementById("pointsLabel");

    if (planLabel) {
      planLabel.textContent = plan;
    }

    if (pointsLabel) {
      pointsLabel.textContent = String(points);
    }

    const dashboardPlanBadge = document.getElementById("dashboardPlanBadge");
    const dashboardPointsValue = document.getElementById("dashboardPointsValue");

    if (dashboardPlanBadge) {
      dashboardPlanBadge.textContent = `${String(plan).toUpperCase()} PLAN`;
    }

    if (dashboardPointsValue) {
      dashboardPointsValue.textContent = String(points);
    }
  }

  // 🔹 Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = 'login.html';
      sessionStorage.removeItem('currentListId');
    });
  }
