import { auth, db } from "./firebaseConfig.js?v=4";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getPublicListTitle(publicId) {
  if (!publicId) return "Signup List";

  const publicListRef = doc(db, "publicLists", publicId);
  const publicListSnap = await getDoc(publicListRef);

  if (!publicListSnap.exists()) {
    return `Signup List ${publicId}`;
  }

  const data = publicListSnap.data() || {};
  return data.title || `Signup List ${publicId}`;
}

async function loadSignupResponses() {
  const panel = document.getElementById("signupResponsesPanel");
  if (!panel) return;

  if (typeof window.hideFormsPanels === "function") {
    window.hideFormsPanels("signupResponsesPanel");
  } else {
    panel.style.display = "block";
  }

  const user = auth.currentUser;
  if (!user) {
    panel.innerHTML = "<p>Please sign in first.</p>";
    return;
  }

  panel.innerHTML = "<p>Loading signup responses...</p>";

  const q = query(
    collection(db, "publicListSignups"),
    where("ownerUid", "==", user.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    panel.innerHTML = "<p>No signup responses yet.</p>";
    return;
  }

  const groups = {};

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const publicId = data.publicId || "No Code";

    if (!groups[publicId]) {
      groups[publicId] = [];
    }

    groups[publicId].push(data);
  });

  let html = `<h3>Signup Responses</h3>`;

  for (const [publicId, signups] of Object.entries(groups)) {
    const listTitle = await getPublicListTitle(publicId);

    html += `
      <div style="border:1px solid #ccc; border-radius:10px; padding:12px; margin-bottom:18px;">
        <h4 style="margin:0 0 10px 0;">
          ${escapeHtml(listTitle)}
        </h4>
        <div style="font-size:12px; color:#777; margin-bottom:10px;">
          List code: ${escapeHtml(publicId)} · ${signups.length} signup(s)
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        <button type="button" class="copySignupEmailsBtn" data-public-id="${escapeHtml(publicId)}">
          Copy Emails
        </button>

        <button type="button" class="printSignupListBtn" data-public-id="${escapeHtml(publicId)}">
          Print List
        </button>

        <button type="button" class="exportSignupCsvBtn" data-public-id="${escapeHtml(publicId)}">
          Export CSV
        </button>
      </div>
    `;

    signups.forEach((data) => {
      const values = data.values || {};

      const name = values.name || values.Name || "";
      const email = values.email || values.Email || "";
      const phone = values.phone || values.Phone || "";

      html += `
        <div style="border:1px solid #ddd; border-radius:8px; padding:10px; margin-bottom:10px;">
          <div><strong>Name:</strong> ${escapeHtml(name)}</div>
          <div><strong>Email:</strong> ${escapeHtml(email)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(phone)}</div>
        </div>
      `;
    });

    html += `</div>`;
  }

  panel.innerHTML = html;
  wireSignupResponseActions(groups);
}

function wireSignupResponseActions(groups) {
  wireCopyEmails(groups);
  wirePrintLists(groups);
  wireExportCsv(groups);
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("viewSignupList");

  if (btn) {
    btn.addEventListener("click", loadSignupResponses);
  }
});

function wireCopyEmails(groups) {
  document.querySelectorAll(".copySignupEmailsBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const publicId = btn.dataset.publicId;
      const signups = groups[publicId] || [];

      const emails = signups
        .map((signup) => signup.values?.email || "")
        .filter(Boolean)
        .join("; ");

      if (!emails) {
        alert("This list has no email addresses.");
        return;
      }

      try {
        await navigator.clipboard.writeText(emails);
        alert("Email addresses copied to clipboard.");
      } catch (err) {
        console.error(err);
        alert("Could not copy email addresses.");
      }
    });
  });
}

function wirePrintLists(groups) {
  document.querySelectorAll(".printSignupListBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const publicId = btn.dataset.publicId;
      const signups = groups[publicId] || [];

      const title =
        btn.closest("div")?.previousElementSibling?.previousElementSibling
          ?.textContent || "Signup List";

      let html = `
        <html>
        <head>
          <title>${title}</title>
          <style>
            body{
              font-family:Arial,sans-serif;
              margin:30px;
            }

            table{
              width:100%;
              border-collapse:collapse;
            }

            th,td{
              border:1px solid #ccc;
              padding:8px;
              text-align:left;
            }

            th{
              background:#f3f3f3;
            }

            h2{
              margin-bottom:20px;
            }
          </style>
        </head>
        <body>

        <h2>${title}</h2>

        <table>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
      `;

      signups.forEach((signup) => {
        const values = signup.values || {};

        html += `
          <tr>
            <td>${values.name || ""}</td>
            <td>${values.email || ""}</td>
            <td>${values.phone || ""}</td>
          </tr>
        `;
      });

      html += `
        </table>
        </body>
        </html>
      `;

      const win = window.open("", "_blank");

      win.document.write(html);
      win.document.close();

      win.focus();
      win.print();
    });
  });
}

function wireExportCsv(groups) {
  document.querySelectorAll(".exportSignupCsvBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const publicId = btn.dataset.publicId;
      const signups = groups[publicId] || [];

      let csv = "Name,Email,Phone\n";

      signups.forEach((signup) => {
        const values = signup.values || {};

        csv += `"${values.name || ""}","${values.email || ""}","${values.phone || ""}"\n`;
      });

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${publicId}-contacts.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    });
  });
}