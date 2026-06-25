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
// - Free accounts: 60MB
// - Paid accounts: 120MB
// - Admin accounts: 120MB

async function getUserUploadLimitBytes(user) {
  const FREE_MAX_BYTES = 60 * 1024 * 1024;
  const PAID_MAX_BYTES = 120 * 1024 * 1024;
  const ADMIN_MAX_BYTES = 120 * 1024 * 1024;

  if (!user?.uid) return FREE_MAX_BYTES;

  try {
    const tokenResult = await user.getIdTokenResult(true);
    const isAdmin = tokenResult?.claims?.admin === true;

    if (isAdmin) {
      return ADMIN_MAX_BYTES;
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return FREE_MAX_BYTES;
    }

    const data = snap.data() || {};
    const plan = typeof data.plan === "string" ? data.plan.toLowerCase() : "";
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

  if (maxMB === 120) {
    hintEl.textContent = "Paid and admin accounts can upload up to 120MB per document.";
  } else {
    hintEl.textContent = "Free accounts can upload up to 60MB per document. Paid and admin accounts can upload up to 120MB per document.";
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
    //console.log("UPLOAD DEBUG - form submit intercepted");

    try {
      const user = auth?.currentUser;
      if (!user) {
        setStatus("Please sign in to upload.", false);
        return;
      }

      const file = fileEl?.files?.[0];
      //console.log("UPLOAD DEBUG - selected file:", file);
      //console.log("UPLOAD DEBUG - file name:", file?.name);
      //console.log("UPLOAD DEBUG - file type:", file?.type);
      //console.log("UPLOAD DEBUG - file size:", file?.size);
      if (!file) {
        setStatus("Select a file first.", false);
        return;
      }

      // basic type check
      const allowed = [
        "application/pdf",
        "image/jpeg",   // JPG
        "image/png",    // PNG
        "image/svg+xml" // SVG
      ];

      const name = file.name.toLowerCase();
      const isSvgByName = name.endsWith(".svg");

      //console.log("UPLOAD DEBUG - allowed list:", allowed);
      //console.log("UPLOAD DEBUG - is allowed MIME:", allowed.includes(file.type));
      //console.log("UPLOAD DEBUG - is SVG by name:", isSvgByName);

      if (!allowed.includes(file.type) && !isSvgByName) {
        setStatus("Only PDF, JPG, PNG, and SVG files are allowed.", false);
        return;
      }

      // Dynamic upload-size validation based on paid status
      const maxAllowed = await getUserUploadLimitBytes(user);
        if (file.size > maxAllowed) {
          const maxMB = Math.round(maxAllowed / (1024 * 1024));

          let msg = `File must be under ${maxMB}MB for your current account level.`;

          if (maxMB === 120) {
            msg = "File must be under 120MB for paid accounts.";
          } else if (maxMB === 60) {
            msg = "File must be under 60MB for free accounts.";
          }

          setStatus(msg, false);
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

      //console.log("createDocumentPaid response:", createRes.data);
      //console.log("UPLOAD DEBUG - createDocumentPaid response:", createRes);
      //console.log("UPLOAD DEBUG - createDocumentPaid data:", createRes?.data);

      const docId = createRes?.data?.docId;
      const storagePath = createRes?.data?.storagePath;

      if (!docId || !storagePath) {
        throw new Error("Server did not return docId/storagePath.");
      }

      // 2) Upload file
      //console.log("UPLOAD DEBUG - docId:", docId);
      //console.log("UPLOAD DEBUG - storagePath:", storagePath);
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);

      // 3) Get download URL
      const url = await getDownloadURL(fileRef);
      //console.log("UPLOAD DEBUG - downloadURL:", url);

      // 4) Finalize document metadata
      await finalizeDocumentUpload({ docId, downloadURL: url });

      const isImageUpload = file.type.startsWith("image/");

      setStatus(
        isImageUpload
          ? "Picture uploaded successfully!"
          : "Document uploaded successfully!"
      );

      formEl.reset();

      // Refresh hint in case plan/points changed externally
      await refreshUploadHint();

      // Hide upload panel
      if (panel) panel.style.display = "none";

      // Show My Documents panel
      if (typeof window.loadUserDocuments === "function") {
        const documentList = document.getElementById("documentList");
        const formContainer = document.getElementById("formContainer");
        const previewContainer = document.getElementById("preview-container");
        const dashBoard = document.getElementById("dashBoard");
        const pdfViewerPanel = document.getElementById("pdfViewerPanel");

        if (dashBoard) dashBoard.style.display = "none";
        if (formContainer) formContainer.style.display = "none";
        if (previewContainer) previewContainer.style.display = "none";
        if (pdfViewerPanel) pdfViewerPanel.style.display = "none";
        if (documentList) documentList.style.display = "block";

        await window.loadUserDocuments();
      }
    } catch (err) {
      //console.error("Upload failed:", err);
      //console.log("UPLOAD DEBUG - error code:", err?.code);
      //console.log("UPLOAD DEBUG - error message:", err?.message);
      //console.log("UPLOAD DEBUG - error details:", err?.details);

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