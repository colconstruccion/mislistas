// shareEmailLists.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.loadSavedEmailListsForSharing = async function (optionsId) {
  console.log("loadSavedEmailListsForSharing called");
  
  const optionsWrap = document.getElementById(optionsId);

  if (!optionsWrap) return;

  const user = auth.currentUser;

  if (!user) {
    optionsWrap.innerHTML = `<p>Please log in to use saved email lists.</p>`;
    return;
  }

  optionsWrap.innerHTML = `<p>Loading saved email lists...</p>`;

  try {
    const emailListsRef = collection(
      db,
      "users",
      user.uid,
      "emailLists"
    );

    const q = query(emailListsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      optionsWrap.innerHTML = `
        <p style="color:#666; font-size:14px;">
          No saved email lists yet.
        </p>
      `;
      return;
    }

    let html = `
      <div class="share-email-lists-options">
    `;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};

      const personalCount =
        data.stats?.personalCount ||
        data.personalEmails?.length ||
        0;

      const roleCount =
        data.stats?.roleCount ||
        data.roleEmails?.length ||
        0;

      const totalCount = personalCount + roleCount;

      html += `
        <label class="share-email-list-option">
          <input
            type="checkbox"
            class="share-email-list-checkbox"
            value="${docSnap.id}"
          >
          <span>
            ${escapeHtml(data.name || "Untitled Email List")}
            <small>(${totalCount} emails)</small>
          </span>
        </label>
      `;
    });

    html += `
      </div>
    `;

    optionsWrap.innerHTML = html;

  } catch (error) {
    console.error("Error loading saved email lists for sharing:", error);

    optionsWrap.innerHTML = `
      <p style="color:#a00;">
        Could not load saved email lists.
      </p>
    `;
  }
};

window.getSelectedShareEmailListIds = function () {
  return [
    ...document.querySelectorAll(".share-email-list-checkbox:checked")
  ].map(checkbox => checkbox.value);
};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}