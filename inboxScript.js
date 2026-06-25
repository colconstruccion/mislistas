import { auth, db } from "./firebaseConfig.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

let inboxUnsubscribe = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInboxDate(createdAt) {
  if (!createdAt || typeof createdAt.toDate !== "function") {
    return "";
  }

  return createdAt.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getOpenLink(item) {
  if (item.publicLink) return item.publicLink;

  if (item.itemType === "document" && item.publicId) {
    return `https://lysty.co/doc/${item.publicId}`;
  }

  if (item.itemType === "list" && item.publicId) {
    return `https://lysty.co/list/${item.publicId}`;
  }

  return "#";
}

function renderInboxRow(user, docSnap) {

  const item = docSnap.data() || {};
  const inboxId = docSnap.id;

  const tr = document.createElement("tr");

  const fromEmail = escapeHtml(item.fromEmail || "");
  const receivedDate = escapeHtml(formatInboxDate(item.createdAt));
  const openLink = getOpenLink(item);
  const title = escapeHtml(item.title || "Untitled");

 tr.innerHTML = `
  <td>${fromEmail}</td>

  <td>${title}</td>

  <td>${receivedDate}</td>

  <td>
      <button class="inbox-open-btn">Open</button>
    </td>

    <td>
      ${
        item.itemType === "document"
          ? `<button class="inbox-download-btn">Download</button>`
          : `<span style="opacity:.5;">—</span>`
      }
    </td>

    <td>
      <button class="inbox-delete-btn">Delete</button>
    </td>
  `;

  const openBtn = tr.querySelector(".inbox-open-btn");
  const downloadBtn = tr.querySelector(".inbox-download-btn");
  const deleteBtn = tr.querySelector(".inbox-delete-btn");

  openBtn?.addEventListener("click", async () => {

    try {
      await updateDoc(doc(db, "users", user.uid, "inbox", inboxId), {
        status: "read",
        updatedAt: new Date()
      });
    } catch (err) {
      console.warn("Could not mark inbox item as read:", err);
    }

    if (openLink !== "#") {
      window.open(openLink, "_blank", "noopener,noreferrer");
    }
  });

  downloadBtn?.addEventListener("click", async () => {

    const downloadUrl =
      item.downloadURL ||
      item.publicLink ||
      getOpenLink(item);

    if (!downloadUrl || downloadUrl === "#") {
      alert("No download URL found.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid, "inbox", inboxId), {
        status: "read",
        updatedAt: new Date()
      });
    } catch (err) {
      console.warn("Could not mark inbox item as read:", err);
    }

    const a = document.createElement("a");

    a.href = downloadUrl;
    a.target = "_blank";

    if (item.filename) {
      a.download = item.filename;
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  deleteBtn?.addEventListener("click", async () => {

    const ok = confirm("Delete this inbox item?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "inbox", inboxId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete inbox item.");
    }
  });

  return tr;
}

function loadInboxForUser(user) {
  const inboxList = document.getElementById("inboxList");
  if (!inboxList) return;

  if (inboxUnsubscribe) {
    inboxUnsubscribe();
    inboxUnsubscribe = null;
  }

  inboxList.innerHTML = "<p>Loading inbox...</p>";

  const inboxRef = collection(db, "users", user.uid, "inbox");
  const q = query(inboxRef, orderBy("createdAt", "desc"));

  inboxUnsubscribe = onSnapshot(
    q,
    (snapshot) => {
      inboxList.innerHTML = "";

      if (snapshot.empty) {
        inboxList.innerHTML = "<p>Your inbox is empty.</p>";
        return;
      }

      const table = document.createElement("table");

        table.className = "inbox-table";

       table.innerHTML = `
        <thead>
            <tr>
            <th>FROM</th>
            <th>TITLE</th>
            <th>RECEIVED</th>
            <th>OPEN</th>
            <th>DOWNLOAD</th>
            <th>DELETE</th>
            </tr>
        </thead>
        `;

        const tbody = document.createElement("tbody");

        snapshot.forEach((docSnap) => {
        tbody.appendChild(renderInboxRow(user, docSnap));
        });

        table.appendChild(tbody);

        inboxList.appendChild(table);
    },
    (error) => {
      console.error("Inbox listener failed:", error);
      inboxList.innerHTML = "<p>Could not load inbox.</p>";
    }
  );
}

onAuthStateChanged(auth, (user) => {
  const inboxList = document.getElementById("inboxList");

  if (!user) {
    if (inboxUnsubscribe) {
      inboxUnsubscribe();
      inboxUnsubscribe = null;
    }

    if (inboxList) {
      inboxList.innerHTML = "<p>Please sign in to see your inbox.</p>";
    }

    return;
  }

  loadInboxForUser(user);
});