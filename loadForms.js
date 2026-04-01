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
                value="${escapeHtml(data.password)}"
                readonly
                data-original-password="${escapeHtml(data.password)}"
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
      btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        const input = row?.querySelector(".saved-form-password");
        const icon = btn.querySelector(".material-icons");
        if (!input) return;

        const hidden = input.type === "password";
        input.type = hidden ? "text" : "password";
        if (icon) {
          icon.textContent = hidden ? "visibility_off" : "visibility";
        }
      });
    });

    formsTableWrap.querySelectorAll(".copy-saved-password").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const input = row?.querySelector(".saved-form-password");
        if (!input) return;

        try {
          await navigator.clipboard.writeText(input.value || "");
          if (window.showToast) {
            window.showToast("Password copied");
          } else {
            alert("Password copied");
          }
        } catch (err) {
          alert("Could not copy password");
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

        const isReadonly = input.hasAttribute("readonly");

        if (isReadonly) {
          input.removeAttribute("readonly");
          input.focus();
          input.type = "text";
          input.classList.add("editing-password");

          if (icon) {
            icon.textContent = "save";
          }

          return;
        }

        const newPassword = input.value || "";
        const oldPassword = input.dataset.originalPassword || "";

        if (!newPassword.trim()) {
          alert("Password cannot be empty.");
          input.focus();
          return;
        }

        if (newPassword === oldPassword) {
          input.setAttribute("readonly", "readonly");
          input.classList.remove("editing-password");
          input.type = "password";

          if (icon) {
            icon.textContent = "edit";
          }
          return;
        }

        try {
          await updateDoc(doc(db, "users", user.uid, "forms", formId), {
            password: newPassword,
            updatedAt: serverTimestamp()
          });

          input.dataset.originalPassword = newPassword;
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
          alert("Could not update password");
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