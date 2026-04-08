import { auth } from "./firebaseConfig.js?v=4";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

async function uploadFooterImageToStorage(file) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const storage = getStorage();

  const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
  const fileName = `footer-${Date.now()}-${cleanName}`;

  const storageRef = ref(
    storage,
    `users/${user.uid}/assets/footers/${fileName}`
  );

  await uploadBytes(storageRef, file, {
    contentType: file.type
  });

  const downloadURL = await getDownloadURL(storageRef);

  return {
    downloadURL,
    storagePath: storageRef.fullPath
  };
}

async function deleteFooterImageFromStorage(storagePath) {
  if (!storagePath) return;

  const storage = getStorage();
  const imageRef = ref(storage, storagePath);
  await deleteObject(imageRef);
}

document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("uploadFooterBtn");
  const fileInput = document.getElementById("footerImageInput");
  const previewContainer = document.querySelector(".preview-container");

  let footerPreview = document.getElementById("footerPreview");
  if (!footerPreview) {
    footerPreview = document.createElement("div");
    footerPreview.id = "footerPreview";
    previewContainer.appendChild(footerPreview);
  }

  const savedFooter = sessionStorage.getItem("footerImage");
  if (savedFooter) {
    footerPreview.innerHTML = `
      <button class="remove-footer-btn" title="Remove Footer">&times;</button>
      <img src="${savedFooter}" alt="Footer Image" crossorigin="anonymous" />
    `;

    const removeBtn = footerPreview.querySelector(".remove-footer-btn");
    removeBtn.addEventListener("click", async () => {
      const oldPath = sessionStorage.getItem("footerImagePath");

      try {
        if (oldPath) {
          await deleteFooterImageFromStorage(oldPath);
        }
      } catch (err) {
        console.warn("Could not delete footer image from storage:", err);
      }

      sessionStorage.removeItem("footerImage");
      sessionStorage.removeItem("footerImagePath");
      footerPreview.innerHTML = "";
    });
  }

  uploadBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    (async () => {
      const oldFooterPath = sessionStorage.getItem("footerImagePath");

      try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Uploading...";

        const result = await uploadFooterImageToStorage(file);
        const imageUrl = result.downloadURL;

        // Delete previous footer only after new upload succeeds
        if (oldFooterPath && oldFooterPath !== result.storagePath) {
          try {
            await deleteFooterImageFromStorage(oldFooterPath);
          } catch (deleteErr) {
            console.warn("Could not delete previous footer image:", deleteErr);
          }
        }

        sessionStorage.setItem("footerImage", imageUrl);
        sessionStorage.setItem("footerImagePath", result.storagePath);

        footerPreview.innerHTML = `
          <button class="remove-footer-btn" title="Remove Footer">&times;</button>
          <img src="${imageUrl}" alt="Footer Image" crossorigin="anonymous" />
        `;

        const removeBtn = footerPreview.querySelector(".remove-footer-btn");
        removeBtn.addEventListener("click", async () => {
          const currentPath = sessionStorage.getItem("footerImagePath");

          try {
            if (currentPath) {
              await deleteFooterImageFromStorage(currentPath);
            }
          } catch (err) {
            console.warn("Could not delete footer image from storage:", err);
          }

          sessionStorage.removeItem("footerImage");
          sessionStorage.removeItem("footerImagePath");
          footerPreview.innerHTML = "";
        });

      } catch (err) {
        console.error("Footer upload failed:", err);
        alert("Could not upload footer image.");
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Add Footer";
        fileInput.value = "";
      }
    })();
  });
});