import { auth, db } from "./firebaseConfig.js?v=4";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

function getCurrentListTitle() {
  const titleEl = document.getElementById("title");
  return (titleEl?.value || "").trim() || "Untitled List";
}

function refreshPreviewBeforeCapture() {
  if (typeof window.updatePreview === "function") {
    window.updatePreview();
  } else if (typeof updatePreview === "function") {
    updatePreview();
  }
}

function buildCaptureNode() {
  const preview = document.getElementById("preview-container");
  if (!preview) {
    throw new Error("Preview container not found.");
  }

  const clone = preview.cloneNode(true);

  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.width = "800px";
  clone.style.maxWidth = "800px";
  clone.style.background = "#ffffff";
  clone.style.padding = "24px";
  clone.style.boxSizing = "border-box";
  clone.style.zIndex = "99999";
  clone.style.display = "block";

  const liveHeader = clone.querySelector("#livePreviewHeader");
  if (liveHeader) {
    liveHeader.remove();
  }

  // Remove header/footer X buttons from cloned preview before PDF capture
  clone.querySelectorAll(".remove-btn, .remove-footer-btn").forEach(btn => {
    btn.remove();
  });

  document.body.appendChild(clone);
  return clone;
}

async function waitForImagesToLoad(container) {
  const images = Array.from(container.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };

        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
}

async function buildPdfBlobFromPreview() {
  refreshPreviewBeforeCapture();

 const captureNode = buildCaptureNode();

  try {
    // 🔥 WAIT FOR IMAGES
    await waitForImagesToLoad(captureNode);

    // small buffer delay (important)
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(captureNode, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - 20) {
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    } else {
      let remainingHeight = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      remainingHeight -= (pageHeight - 20);

      while (remainingHeight > 0) {
        pdf.addPage();
        position = 10 - (imgHeight - remainingHeight);
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        remainingHeight -= (pageHeight - 20);
      }
    }

    return pdf.output("blob");
  } finally {
    captureNode.remove();
  }
}

async function uploadPdfBlob(userId, pdfBlob, fileName) {
  const storage = getStorage();
  const storagePath = `users/${userId}/documents/${fileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, pdfBlob, {
    contentType: "application/pdf"
  });

  const downloadURL = await getDownloadURL(storageRef);

  return {
    storagePath,
    downloadURL
  };
}

async function addDocumentRecord(userId, fileName, uploadResult) {
  await addDoc(collection(db, "users", userId, "documents"), {
    title: fileName,
    fileName: fileName,
    downloadURL: uploadResult.downloadURL,
    storagePath: uploadResult.storagePath,
    mimeType: "application/pdf",
    extension: "pdf",
    type: "pdf",
    source: "list-preview-export",
    visible: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

async function savePreviewAsPdfToDocuments() {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in first.");
    return;
  }

  try {
    const cleanTitle = getCurrentListTitle()
      .replace(/[\\/:*?"<>|]+/g, "")
      .trim() || "Untitled List";

    const fileName = `${cleanTitle}-${Date.now()}.pdf`;

    const pdfBlob = await buildPdfBlobFromPreview();
    const uploadResult = await uploadPdfBlob(user.uid, pdfBlob, fileName);
    await addDocumentRecord(user.uid, fileName, uploadResult);

    alert("Preview PDF saved to My Documents.");

    if (typeof window.loadUserDocuments === "function") {
      await window.loadUserDocuments();
    }
  } catch (err) {
    console.error("savePreviewAsPdfToDocuments failed:", err);
    alert("Could not save preview as PDF.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("savePreviewPdfBtn");
  if (btn) {
    btn.addEventListener("click", savePreviewAsPdfToDocuments);
  }
});