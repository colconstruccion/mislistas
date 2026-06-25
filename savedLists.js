// savedLists.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const savedEmailListsLink = document.getElementById("savedEmailListsLink");

  if (savedEmailListsLink) {
    savedEmailListsLink.addEventListener("click", async (e) => {
      e.preventDefault();
      window.openSavedEmailListsPanel();
      await loadSavedEmailLists();
    });
  }

});

async function loadSavedEmailLists() {
  const tableWrap = document.getElementById("savedEmailListsTableWrap");

  if (!tableWrap) return;

  const user = auth.currentUser;

  if (!user) {
    tableWrap.innerHTML = `<p>Please log in first.</p>`;
    return;
  }

  tableWrap.innerHTML = `<p>Loading saved email lists...</p>`;

  try {
    const emailListsRef = collection(
      db,
      "users",
      user.uid,
      "emailLists"
    );

    const q = query(emailListsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tableWrap.innerHTML = `<p>No saved email lists yet.</p>`;
      return;
    }

    let rows = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      const personalCount =
        data.stats?.personalCount ||
        data.personalEmails?.length ||
        0;

      const roleCount =
        data.stats?.roleCount ||
        data.roleEmails?.length ||
        0;

      const totalCount = personalCount + roleCount;

      const createdDate = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleDateString()
        : "";

      rows += `
        <tr>
          <td>${escapeHtml(data.name || "Untitled")}</td>
          <td>${personalCount}</td>
          <td>${roleCount}</td>
          <td>${totalCount}</td>
          <td>${createdDate}</td>
          <td>
            <button 
              class="open-email-list-btn"
              data-id="${docSnap.id}">
              Open
            </button>
          </td>
          <td>
            <button 
              class="delete-email-list-btn"
              data-id="${docSnap.id}">
              Delete
            </button>
          </td>
          <td>
            <button
              type="button"
              class="export-email-list-csv-btn"
              onclick="exportEmailListCsv('${docSnap.id}')">
              CSV
            </button>
          </td>
        </tr>
      `;
    });

    tableWrap.innerHTML = `
      <table class="saved-email-lists-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Personal</th>
            <th>Generic</th>
            <th>Total</th>
            <th>Created</th>
            <th>Open</th>
            <th>Delete</th>
            <th>Export</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    attachDeleteButtons();
    attachOpenButtons();

  } catch (error) {
    console.error("Error loading email lists:", error);
    tableWrap.innerHTML = `
      <p style="color:#a00;">
        Could not load saved email lists.
      </p>
    `;
  }
}

function attachDeleteButtons() {
  document.querySelectorAll(".delete-email-list-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const listId = button.dataset.id;

      const confirmed = confirm(
        "Delete this saved email list?"
      );

      if (!confirmed) return;

      await deleteEmailList(listId);
    });
  });
}

async function deleteEmailList(listId) {
  const user = auth.currentUser;

  if (!user || !listId) return;

  try {
    await deleteDoc(
      doc(db, "users", user.uid, "emailLists", listId)
    );

    await loadSavedEmailLists();

  } catch (error) {
    console.error("Error deleting email list:", error);
    alert("Could not delete email list.");
  }
}

function attachOpenButtons() {
  document.querySelectorAll(".open-email-list-btn").forEach(button => {
    button.addEventListener("click", () => {
      const listId = button.dataset.id;

      if (typeof window.openSavedEmailList === "function") {
        window.openSavedEmailList(listId);
      }
    });
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.exportEmailListCsv = async function (listId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first.");
    return;
  }

  const listRef = doc(db, "users", user.uid, "emailLists", listId);
  const snap = await getDoc(listRef);

  if (!snap.exists()) {
    alert("Email list not found.");
    return;
  }

  const data = snap.data() || {};
  const personalEmails = data.personalEmails || [];
  const roleEmails = data.roleEmails || [];

  const rows = [
    ["#", "Email Address", "Type"],
    ...personalEmails.map((email, index) => [
      index + 1,
      email,
      "Personal"
    ]),
    ...roleEmails.map((email, index) => [
      personalEmails.length + index + 1,
      email,
      "Generic"
    ])
  ];

  const csv = rows
    .map(row => row.map(csvEscape).join(","))
    .join("\n");

  const safeName = String(data.name || "email-list")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  downloadCsvFile(`${safeName}.csv`, csv);
};

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsvFile(filename, content) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}