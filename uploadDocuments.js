// uploadDocuments.js
// Uses window._firebase from firebaseConfig.js

import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const { app, auth, storage } = window._firebase || {};


// UI elements
const loadDocLink = document.getElementById("loadDocLink");
const panel = document.getElementById("docUploadPanel");
const formEl = document.getElementById("docUploadForm");
const fileEl = document.getElementById("docFile");
const titleEl = document.getElementById("docTitle");
const statusEl = document.getElementById("docUploadStatus");
const cancelBtn = document.getElementById("docUploadCancelBtn");
const formContainer = document.getElementById("formContainer");

const functions = getFunctions(app);
const createDocumentPaid = httpsCallable(functions, "createDocumentPaid");
const finalizeDocumentUpload = httpsCallable(functions, "finalizeDocumentUpload");

// Small helper
function setStatus(msg, ok = true) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "#0a0" : "#a00";
}

// Show/Hide panel
if (loadDocLink && panel) {
  loadDocLink.addEventListener("click", () => {
    const panelIsHidden = panel.style.display === "none" || !panel.style.display;

    if (panelIsHidden) {
      // SHOW upload panel, HIDE formContainer
      panel.style.display = "block";
      if (formContainer) formContainer.style.display = "none";
    } else {
      // HIDE upload panel, SHOW formContainer
      panel.style.display = "none";
      if (formContainer) formContainer.style.display = "block";
    }

    setStatus(""); // clear message area
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

      setStatus("Uploading… please wait.");

      // 1) Ask server if user can upload (reserve docId + storagePath)
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

      // 2) Upload file to the authorized path
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);

      // 3) Get download URL
      const url = await getDownloadURL(fileRef);

      // 4) Finalize metadata (server-side)
      await finalizeDocumentUpload({ docId, downloadURL: url });

      setStatus("Uploaded successfully!");
      formEl.reset();
    } catch (err) {
      console.error("Upload failed:", err);

      const code = err?.code || "";

      // Prefer server-provided messages when available
      const serverMsg =
        err?.message ||
        err?.details?.message || // sometimes details contains message
        "";

      let msg = "Upload failed. Check console for details.";

      if (code === "functions/resource-exhausted") {
        msg = "You’ve used your 10 free documents. Please buy points to upload more.";
      } else if (code === "functions/invalid-argument") {
        // ✅ this will show your MAX_BYTES message (file too large, invalid type, etc.)
        msg = serverMsg || "Invalid upload. Please check the file and try again.";
      } else if (code === "functions/unauthenticated") {
        msg = "Please sign in to upload.";
      } else if (serverMsg) {
        // fallback to any meaningful message
        msg = serverMsg;
      }

      setStatus(msg, false);
    }
  });
}
