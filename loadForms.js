import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const db = getFirestore();
let unsubscribeForms = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.loadUserForms = function loadUserForms() {
  const auth = window._firebase?.auth;
  const user = auth?.currentUser;
  const formsTableWrap = document.getElementById("formsTableWrap");

  if (!user || !formsTableWrap) return;

  if (unsubscribeForms) {
    unsubscribeForms();
    unsubscribeForms = null;
  }

  const q = query(
    collection(db, "users", user.uid, "forms"),
    orderBy("createdAt", "desc")
  );

  unsubscribeForms = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      formsTableWrap.innerHTML = `<p>No forms saved yet.</p>`;
      return;
    }

    let html = `
      <div class="forms-table-container">
        <table class="forms-table">
          <thead>
            <tr>
              <th>Login Account</th>
              <th>Username</th>
              <th>Password</th>
              <th style="width:220px;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    snapshot.forEach((snap) => {
      const data = snap.data();
      const formId = snap.id;

      html += `
        <tr data-form-id="${formId}">
          <td>${escapeHtml(data.account)}</td>
          <td>${escapeHtml(data.username)}</td>
          <td>
            <div class="form-password-cell">
              <input
                type="password"
                class="saved-form-password"
                value=""
                readonly
                data-password-encrypted="${escapeHtml(data.passwordEncrypted || "")}"
                data-password-iv="${escapeHtml(data.passwordIv || "")}"
                data-password-salt="${escapeHtml(data.passwordSalt || "")}"
              />
            </div>
          </td>
          <td>
            <div class="form-actions-row">
              <button type="button" class="icon-btn toggle-saved-password" title="Show or hide password">
                <span class="material-icons">visibility</span>
              </button>

              <button type="button" class="icon-btn copy-saved-password" title="Copy password">
                <span class="material-icons">content_copy</span>
              </button>

              <button type="button" class="icon-btn update-saved-password" title="Edit or save password">
                <span class="material-icons">edit</span>
              </button>

              <button type="button" class="icon-btn delete-saved-form" title="Delete form">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    formsTableWrap.innerHTML = html;

    formsTableWrap.querySelectorAll(".toggle-saved-password").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const input = row?.querySelector(".saved-form-password");
        const icon = btn.querySelector(".material-icons");
        if (!input) return;

        const hidden = input.type === "password";

        if (hidden) {
          const vaultKey = window.getVaultKeyFromSession?.() || "";
          if (!vaultKey) {
            alert("Vault is locked.");
            return;
          }

          try {
            const decrypted = await window.decryptWithVaultKey(
              {
                encrypted: input.dataset.passwordEncrypted,
                iv: input.dataset.passwordIv,
                salt: input.dataset.passwordSalt
              },
              vaultKey
            );

            input.value = decrypted;
            input.type = "text";

            if (icon) {
              icon.textContent = "visibility_off";
            }
          } catch (err) {
            console.error("Decrypt password error:", err);
            alert("Could not decrypt password.");
          }
        } else {
          input.type = "password";
          input.value = "";

          if (icon) {
            icon.textContent = "visibility";
          }
        }
      });
    });

    formsTableWrap.querySelectorAll(".copy-saved-password").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const input = row?.querySelector(".saved-form-password");
        if (!input) return;

        const vaultKey = window.getVaultKeyFromSession?.() || "";
        if (!vaultKey) {
          alert("Vault is locked.");
          return;
        }

        try {
          const decrypted = await window.decryptWithVaultKey(
            {
              encrypted: input.dataset.passwordEncrypted,
              iv: input.dataset.passwordIv,
              salt: input.dataset.passwordSalt
            },
            vaultKey
          );

          await navigator.clipboard.writeText(decrypted);

          if (window.showToast) {
            window.showToast("Password copied");
          } else {
            alert("Password copied");
          }
        } catch (err) {
          console.error("Copy password error:", err);
          alert("Could not copy password.");
        }
      });
    });

    formsTableWrap.querySelectorAll(".update-saved-password").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const formId = row?.dataset?.formId;
        const input = row?.querySelector(".saved-form-password");
        const icon = btn.querySelector(".material-icons");

        if (!formId || !input) return;

        const vaultKey = window.getVaultKeyFromSession?.() || "";
        if (!vaultKey) {
          alert("Vault is locked.");
          return;
        }

        const isReadonly = input.hasAttribute("readonly");

        if (isReadonly) {
          try {
            const decrypted = await window.decryptWithVaultKey(
              {
                encrypted: input.dataset.passwordEncrypted,
                iv: input.dataset.passwordIv,
                salt: input.dataset.passwordSalt
              },
              vaultKey
            );

            input.value = decrypted;
            input.removeAttribute("readonly");
            input.focus();
            input.type = "text";
            input.classList.add("editing-password");

            if (icon) {
              icon.textContent = "save";
            }
          } catch (err) {
            console.error("Prepare password update error:", err);
            alert("Could not unlock password for editing.");
          }

          return;
        }

        const newPassword = input.value || "";
        if (!newPassword.trim()) {
          alert("Password cannot be empty.");
          input.focus();
          return;
        }

        try {
          const encrypted = await window.encryptWithVaultKey(newPassword, vaultKey);

          await updateDoc(doc(db, "users", user.uid, "forms", formId), {
            passwordEncrypted: encrypted.encrypted,
            passwordIv: encrypted.iv,
            passwordSalt: encrypted.salt,
            updatedAt: serverTimestamp()
          });

          input.dataset.passwordEncrypted = encrypted.encrypted;
          input.dataset.passwordIv = encrypted.iv;
          input.dataset.passwordSalt = encrypted.salt;

          input.value = "";
          input.setAttribute("readonly", "readonly");
          input.classList.remove("editing-password");
          input.type = "password";

          if (icon) {
            icon.textContent = "edit";
          }

          if (window.showToast) {
            window.showToast("Password updated");
          } else {
            alert("Password updated");
          }
        } catch (err) {
          console.error("Update password error:", err);
          alert("Could not update password.");
        }
      });
    });

    formsTableWrap.querySelectorAll(".delete-saved-form").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const formId = row?.dataset?.formId;
        if (!formId) return;

        const ok = confirm("Delete this form?");
        if (!ok) return;

        try {
          await deleteDoc(doc(db, "users", user.uid, "forms", formId));
          if (window.showToast) {
            window.showToast("Form deleted");
          }
        } catch (err) {
          console.error("Delete form error:", err);
          alert("Could not delete form");
        }
      });
    });
  });
};