// openSavedList.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentEmailListId = null;
let currentEmailListData = null;

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backToSavedListsBtn");
  const saveBtn = document.getElementById("saveOpenedEmailListBtn");
  const saveBtnBottom = document.getElementById("saveOpenedEmailListBtnBottom");
  const addNewPersonalEmailBtn = document.getElementById("addPersonalEmailBtn");
  const addNewRoleEmailBtn = document.getElementById("addRoleEmailBtn");

if (addNewPersonalEmailBtn) {
  addNewPersonalEmailBtn.addEventListener("click", () => {
    addNewPersonalEmailToOpenedList();
  });
}

if (addNewRoleEmailBtn) {
  addNewRoleEmailBtn.addEventListener("click", () => {
    addNewRoleEmailToOpenedList();
  });
}

if (backBtn) {
    backBtn.addEventListener("click", async () => {
      if (typeof window.openSavedEmailListsPanel === "function") {
        window.openSavedEmailListsPanel();
      }

      if (typeof window.loadSavedEmailLists === "function") {
        await window.loadSavedEmailLists();
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveAllOpenedEmails);
  }

  if (saveBtnBottom) {
    saveBtnBottom.addEventListener("click", saveAllOpenedEmails);
  }
});

window.openSavedEmailList = async function (listId) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please log in first.");
    return;
  }

  if (!listId) {
    alert("Missing email list ID.");
    return;
  }

  currentEmailListId = listId;

  try {
    const listRef = doc(db, "users", user.uid, "emailLists", listId);
    const snap = await getDoc(listRef);

    if (!snap.exists()) {
      alert("Email list not found.");
      return;
    }

    currentEmailListData = snap.data();

    if (typeof window.openSavedListPanel === "function") {
      window.openSavedListPanel();
    }

    renderOpenedEmailList();

  } catch (error) {
    console.error("Error opening email list:", error);
    alert("Could not open email list.");
  }
};

function renderOpenedEmailList() {
  const title = document.getElementById("openedEmailListTitle");
  const personalCount = document.getElementById("openedPersonalCount");
  const roleCount = document.getElementById("openedRoleCount");

  const personalEmails = currentEmailListData.personalEmails || [];
  const roleEmails = currentEmailListData.roleEmails || [];

  if (title) title.textContent = currentEmailListData.name || "Email List";
  if (personalCount) personalCount.textContent = personalEmails.length;
  if (roleCount) roleCount.textContent = roleEmails.length;

  renderEmailTable("personalEmailsTableWrap", personalEmails, "personal");
  renderEmailTable("roleEmailsTableWrap", roleEmails, "role");
}

function renderEmailTable(containerId, emails, emailType) {
  const container = document.getElementById(containerId);

  if (!container) return;

  if (!emails.length) {
    container.innerHTML = `<p>No emails in this section.</p>`;
    return;
  }

  const rows = emails.map((email, index) => {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <input
            class="opened-email-input"
            type="email"
            value="${escapeHtml(email)}"
            data-type="${emailType}"
            data-index="${index}"
          >
        </td>
        <td>
          <button
            class="delete-opened-email-btn"
            type="button"
            data-type="${emailType}"
            data-index="${index}"
            title="Delete email">
            🗑
          </button>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <table class="opened-email-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Email Address</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  attachDeleteButtons();
}

function attachDeleteButtons() {
  document.querySelectorAll(".delete-opened-email-btn").forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      const index = Number(button.dataset.index);

      deleteEmailFromCurrentData(type, index);
    });
  });
}

function deleteEmailFromCurrentData(type, index) {
  const fieldName = type === "role" ? "roleEmails" : "personalEmails";
  const emails = [...(currentEmailListData[fieldName] || [])];

  emails.splice(index, 1);

  currentEmailListData[fieldName] = emails;

  renderOpenedEmailList();
}

async function saveAllOpenedEmails() {
  if (!currentEmailListData) return;

  const personalInputs = document.querySelectorAll(
    '.opened-email-input[data-type="personal"]'
  );

  const roleInputs = document.querySelectorAll(
    '.opened-email-input[data-type="role"]'
  );

  const personalEmails = [];
  const roleEmails = [];

  for (const input of personalInputs) {
    const email = input.value.trim().toLowerCase();

    if (!email) continue;

    if (!isValidEmail(email)) {
      alert(`Invalid personal email: ${email}`);
      input.focus();
      return;
    }

    personalEmails.push(email);
  }

  for (const input of roleInputs) {
    const email = input.value.trim().toLowerCase();

    if (!email) continue;

    if (!isValidEmail(email)) {
      alert(`Invalid generic email: ${email}`);
      input.focus();
      return;
    }

    roleEmails.push(email);
  }

  currentEmailListData.personalEmails = removeDuplicates(personalEmails);
  currentEmailListData.roleEmails = removeDuplicates(roleEmails);

  await saveOpenedEmailList();

  alert("Email list updated.");
}

async function saveOpenedEmailList() {
  const user = auth.currentUser;

  if (!user || !currentEmailListId || !currentEmailListData) return;

  const personalEmails = currentEmailListData.personalEmails || [];
  const roleEmails = currentEmailListData.roleEmails || [];

  const listRef = doc(
    db,
    "users",
    user.uid,
    "emailLists",
    currentEmailListId
  );

  await updateDoc(listRef, {
    personalEmails,
    roleEmails,

    stats: {
      ...(currentEmailListData.stats || {}),
      personalCount: personalEmails.length,
      roleCount: roleEmails.length
    },

    updatedAt: serverTimestamp()
  });

  renderOpenedEmailList();
}

function removeDuplicates(emails) {
  return [...new Set(emails)];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addNewPersonalEmailToOpenedList() {
  if (!currentEmailListData) return;

  if (!Array.isArray(currentEmailListData.personalEmails)) {
    currentEmailListData.personalEmails = [];
  }

  currentEmailListData.personalEmails.push("");

  renderOpenedEmailList();

  setTimeout(() => {
    const inputs = document.querySelectorAll(
      '.opened-email-input[data-type="personal"]'
    );

    const lastInput = inputs[inputs.length - 1];

    if (lastInput) {
      lastInput.focus();
    }
  }, 50);
}

function addNewRoleEmailToOpenedList() {
  if (!currentEmailListData) return;

  if (!Array.isArray(currentEmailListData.roleEmails)) {
    currentEmailListData.roleEmails = [];
  }

  currentEmailListData.roleEmails.push("");

  renderOpenedEmailList();

  setTimeout(() => {
    const inputs = document.querySelectorAll(
      '.opened-email-input[data-type="role"]'
    );

    const lastInput = inputs[inputs.length - 1];

    if (lastInput) {
      lastInput.focus();
    }
  }, 50);
}
