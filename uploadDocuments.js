// uploadDocuments.js
// Uses window._firebase from firebaseConfig.js

import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const { app, auth, storage } = window._firebase || {};
const db = getFirestore(app);

// UI elements
const loadDocLink = document.getElementById("loadDocLink");
const panel = document.getElementById("docUploadPanel");
const formEl = document.getElementById("docUploadForm");
const fileEl = document.getElementById("docFile");
const titleEl = document.getElementById("docTitle");
const statusEl = document.getElementById("docUploadStatus");
const cancelBtn = document.getElementById("docUploadCancelBtn");
const formContainer = document.getElementById("formContainer");
const hintEl = document.getElementById("docUploadHint");

const functions = getFunctions(app);
const createDocumentPaid = httpsCallable(functions, "createDocumentPaid");
const finalizeDocumentUpload = httpsCallable(functions, "finalizeDocumentUpload");

// Small helper
function setStatus(msg, ok = true) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "#0a0" : "#a00";
}

// Upload limit logic is separate from billing logic:
// - Free accounts: 30MB
// - Paid accounts: 120MB
async function getUserUploadLimitBytes(user) {
  const FREE_MAX_BYTES = 30 * 1024 * 1024;   // 30MB
  const PAID_MAX_BYTES = 120 * 1024 * 1024;  // 120MB

  if (!user?.uid) return FREE_MAX_BYTES;

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return FREE_MAX_BYTES;
    }

    const data = snap.data() || {};
    const plan = typeof data.plan === "string" ? data.plan : "";
    const pointsBalance = Number.isFinite(data.pointsBalance) ? data.pointsBalance : 0;

    const isPaidUser = plan === "paid" || pointsBalance > 0;

    return isPaidUser ? PAID_MAX_BYTES : FREE_MAX_BYTES;
  } catch (err) {
    console.warn("Could not read upload limit from Firestore:", err);
    return FREE_MAX_BYTES;
  }
}

// Update hint text in the panel
async function refreshUploadHint() {
  if (!hintEl) return;

  const user = auth?.currentUser;
  const maxAllowed = await getUserUploadLimitBytes(user);
  const maxMB = Math.round(maxAllowed / (1024 * 1024));

  if (maxMB === 30) {
    hintEl.textContent = "Free accounts can upload up to 30MB per document. Paid accounts can upload up to 120MB per document.";
  } else {
    hintEl.textContent = "Your current upload limit is 120MB per document.";
  }
}

// Show/Hide panel
if (loadDocLink && panel) {
  loadDocLink.addEventListener("click", async () => {
    const panelIsHidden = panel.style.display === "none" || !panel.style.display;

    if (panelIsHidden) {
      panel.style.display = "block";
      if (formContainer) formContainer.style.display = "none";
      await refreshUploadHint();
    } else {
      panel.style.display = "none";
      if (formContainer) formContainer.style.display = "block";
    }

    setStatus("");
  });
}

if (cancelBtn && panel) {
  cancelBtn.addEventListener("click", () => {
    panel.style.display = "none";
    if (formContainer) formContainer.style.display = "block";
    setStatus("");
    if (formEl) formEl.reset();
  });
}

// Handle upload
if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const user = auth?.currentUser;
      if (!user) {
        setStatus("Please sign in to upload.", false);
        return;
      }

      const file = fileEl?.files?.[0];
      if (!file) {
        setStatus("Select a file first.", false);
        return;
      }

      // basic type check
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword" // .doc
      ];

      if (!allowed.includes(file.type)) {
        setStatus("Only PDF or Word (.doc/.docx) files are allowed.", false);
        return;
      }

      // Dynamic upload-size validation based on paid status
      const maxAllowed = await getUserUploadLimitBytes(user);
      if (file.size > maxAllowed) {
        const maxMB = Math.round(maxAllowed / (1024 * 1024));
        setStatus(`File must be under ${maxMB}MB for your current account level.`, false);
        return;
      }

      setStatus("Uploading… please wait.");

      // 1) Reserve doc metadata + storage path
      const createRes = await createDocumentPaid({
        title: (titleEl?.value || "").trim() || file.name,
        filename: file.name,
        size: file.size,
        contentType: file.type,
      });

      console.log("createDocumentPaid response:", createRes.data);

      const docId = createRes?.data?.docId;
      const storagePath = createRes?.data?.storagePath;

      if (!docId || !storagePath) {
        throw new Error("Server did not return docId/storagePath.");
      }

      // 2) Upload file
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);

      // 3) Get download URL
      const url = await getDownloadURL(fileRef);

      // 4) Finalize document metadata
      await finalizeDocumentUpload({ docId, downloadURL: url });

      setStatus("Uploaded successfully!");
      formEl.reset();

      // Refresh hint in case plan/points changed externally
      await refreshUploadHint();
    } catch (err) {
      console.error("Upload failed:", err);

      const code = err?.code || "";
      const serverMsg =
        err?.message ||
        err?.details?.message ||
        "";

      let msg = "Upload failed. Check console for details.";

      if (code === "functions/resource-exhausted") {
        msg = "You’ve used your 10 free documents. Please buy points to upload more.";
      } else if (code === "functions/invalid-argument") {
        msg = serverMsg || "Invalid upload. Please check the file and try again.";
      } else if (code === "functions/unauthenticated") {
        msg = "Please sign in to upload.";
      } else if (serverMsg) {
        msg = serverMsg;
      }

      setStatus(msg, false);
    }
  });
}