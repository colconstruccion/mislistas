import { auth } from "./firebaseConfig.js?v=4";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

async function uploadHeaderImageToStorage(file) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const storage = getStorage();

  const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
  const fileName = `header-${Date.now()}-${cleanName}`;

  const storageRef = ref(
    storage,
    `users/${user.uid}/assets/headers/${fileName}`
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

async function deleteHeaderImageFromStorage(storagePath) {
  if (!storagePath) return;

  const storage = getStorage();
  const imageRef = ref(storage, storagePath);
  await deleteObject(imageRef);
}

document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("uploadHeaderBtn");
  const fileInput = document.getElementById("headerImageInput");
  const previewContainer = document.querySelector(".preview-container");

  let headerPreview = document.getElementById("headerPreview");
  if (!headerPreview) {
    headerPreview = document.createElement("div");
    headerPreview.id = "headerPreview";
    previewContainer.insertBefore(headerPreview, previewContainer.firstChild);
  }

  const savedImage = sessionStorage.getItem("headerImage");
  if (savedImage) {
    headerPreview.innerHTML = `
      <button class="remove-btn" title="Remove Header">&times;</button>
      <img src="${savedImage}" alt="Header Image" crossorigin="anonymous" />
    `;

    const removeBtn = headerPreview.querySelector(".remove-btn");
    removeBtn.addEventListener("click", async () => {
      const oldPath = sessionStorage.getItem("headerImagePath");

      try {
        if (oldPath) {
          await deleteHeaderImageFromStorage(oldPath);
        }
      } catch (err) {
        console.warn("Could not delete header image from storage:", err);
      }

      sessionStorage.removeItem("headerImage");
      sessionStorage.removeItem("headerImagePath");
      headerPreview.innerHTML = "";
    });
  }

  uploadBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    (async () => {
      const oldHeaderPath = sessionStorage.getItem("headerImagePath");

      try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Uploading...";

        const result = await uploadHeaderImageToStorage(file);
        const imageUrl = result.downloadURL;

        // Delete previous header only after new upload succeeds
        if (oldHeaderPath && oldHeaderPath !== result.storagePath) {
          try {
            await deleteHeaderImageFromStorage(oldHeaderPath);
          } catch (deleteErr) {
            console.warn("Could not delete previous header image:", deleteErr);
          }
        }

        sessionStorage.setItem("headerImage", imageUrl);
        sessionStorage.setItem("headerImagePath", result.storagePath);

        headerPreview.innerHTML = `
          <button class="remove-btn" title="Remove Header">&times;</button>
          <img src="${imageUrl}" alt="Header Image" crossorigin="anonymous" />
        `;

        const removeBtn = headerPreview.querySelector(".remove-btn");
        removeBtn.addEventListener("click", async () => {
          const currentPath = sessionStorage.getItem("headerImagePath");

          try {
            if (currentPath) {
              await deleteHeaderImageFromStorage(currentPath);
            }
          } catch (err) {
            console.warn("Could not delete header image from storage:", err);
          }

          sessionStorage.removeItem("headerImage");
          sessionStorage.removeItem("headerImagePath");
          headerPreview.innerHTML = "";
        });

      } catch (err) {
        console.error("Header upload failed:", err);
        alert("Could not upload header image.");
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Add Header";
        fileInput.value = "";
      }
    })();
  });
});