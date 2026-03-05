// publicSearch.js (ES module)
// Looks up publicDocuments/{ID} and renders a View + Download link in the search UI.

import { db } from "./firebaseConfig.js?v=4";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function clearResult(msgEl) {
  msgEl.textContent = "";
  msgEl.style.color = "#333";
}

function showMessage(msgEl, text, isError = false) {
  msgEl.textContent = text;
  msgEl.style.color = isError ? "#a00" : "#333";
}

function ensureToastEl() {
  let el = document.getElementById("toast");
  if (el) return el;

  el = document.createElement("div");
  el.id = "toast";
  el.className = "toast";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  document.body.appendChild(el);
  return el;
}

function showToast(message) {
  const el = ensureToastEl();
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove("show");
  }, 1400);
}


function renderResult(msgEl, data) {
  // data: { title, filename, downloadURL, publicId, visible }
  clearResult(msgEl);

  const name = data.title || data.filename || `Document ${data.publicId || ""}`;
  const url = data.downloadURL;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "12px";
  wrap.style.flexWrap = "wrap";

  const nameEl = document.createElement("div");
  nameEl.style.fontWeight = "600";
  nameEl.textContent = name;

  const viewLink = document.createElement("a");
  viewLink.href = url;
  viewLink.target = "_blank";
  viewLink.rel = "noopener";
  viewLink.textContent = "View";

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.target = "_blank";
  downloadLink.rel = "noopener";
  downloadLink.textContent = "Download";
  // Note: download attribute may be ignored for cross-origin URLs, but it doesn’t hurt.
  downloadLink.setAttribute("download", "");

  // Share link (B2 routing)
  const shareLink = `${location.origin}/doc/${(data.publicId || "").toUpperCase()}`;

  // Icon-only copy button
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "icon-btn";
  copyBtn.setAttribute("aria-label", "Copy link");
  copyBtn.setAttribute("title", "Copy link"); // tooltip on desktop
  copyBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"/>
    </svg>
  `;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      showToast("Link copied");
    } catch (e) {
      // Fallback if clipboard blocked
      window.prompt("Copy this link:", shareLink);
    }
  });

  wrap.appendChild(nameEl);
  wrap.appendChild(viewLink);
  wrap.appendChild(downloadLink);
  wrap.appendChild(copyBtn);

  msgEl.innerHTML = "";
  msgEl.appendChild(wrap);
}

window.searchPublicDocument = async function (rawId) {
  const msgEl = document.getElementById("searchResultMsg");
  if (!msgEl) return;

  const id = (rawId || "").trim().toUpperCase();
  if (!id) {
    showMessage(msgEl, "Enter a document ID (e.g., B3KM).", true);
    return;
  }

  showMessage(msgEl, `Searching for "${id}"…`, false);

  try {
    const ref = doc(db, "publicDocuments", id);
    const snap = await getDoc(ref);

    // If it doesn't exist, either:
    // - the ID is wrong, OR
    // - the document is private/unavailable (because you delete publicDocuments when unchecked)
    if (!snap.exists()) {
      showMessage(msgEl, "This document does not exist or is not available (private).", true);
      return;
    }

    const data = snap.data() || {};

    // Extra safety if you ever decide to keep docs but mark visible=false
    if (data.visible !== true) {
      showMessage(msgEl, "This document is not available (private).", true);
      return;
    }

    if (!data.downloadURL) {
      showMessage(msgEl, "This document entry exists but has no download link.", true);
      return;
    }

    renderResult(msgEl, { ...data, publicId: id });

  } catch (err) {
    console.error("Search failed:", err);
    showMessage(msgEl, "Search failed. Please try again.", true);
  }
};
