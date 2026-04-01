// loadFromFirestore.js
// Lists saved docs and loads OR deletes one from the Workspace.
import { auth, db} from "./firebaseConfig.js?v=4";
import {
  collection, query, orderBy, limit,
  getDocs, doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";


const functions = getFunctions();
const deleteListPaid = httpsCallable(functions, "deleteListPaid");
const toggleDocumentVisibility = httpsCallable(functions, "toggleDocumentVisibility");
const deleteDocumentPaid = httpsCallable(functions, "deleteDocumentPaid");
const renameDocumentTitle = httpsCallable(functions, "renameDocumentTitle");
const sendDocumentShareEmail = httpsCallable(functions, "sendDocumentShareEmail");
/* ---------- Helpers to work with your DOM ---------- */

function validId(id) {
  return typeof id === "string" && id.length > 0 && id !== "undefined";
}

function rebuildInputsAndFill(items, columns = 1) {
  if (typeof window.createItemInputs !== "function") return;

  // Create proper layout using your existing engine
  window.createItemInputs(items.length, columns);

  // Fill values
  const inputs = document.querySelectorAll("input[name='item']");
  items.forEach((text, i) => {
    if (inputs[i]) inputs[i].value = text || "";
  });

  try { window.updatePreview && window.updatePreview(); } catch {}
}

function applyColumnLayout(columns) {
  const container = document.getElementById("itemsContainer");
  if (!container) return;

  container.classList.remove("col-2", "col-3");
  if (columns == 2) container.classList.add("col-2");
  if (columns == 3) container.classList.add("col-3");

  // optional: store for saving if needed
  container.dataset.columns = String(columns);
}

function loadListIntoForm(docData) {
  const { 
    title = "Untitled List", 
    items = [], 
    note = "",
    columns = 1
  } = docData || {};

  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.value = title;

  const cleaned = (Array.isArray(items) ? items : [])
  .map(v => typeof v === "string" ? v : "")
  .filter(v => v.toLowerCase() !== "on");

  const safeColumns = [1, 2, 3].includes(Number(columns)) ? Number(columns) : 1;
  const padded = [...cleaned];

    while (safeColumns > 1 && padded.length % safeColumns !== 0) {
      padded.push("");
    }

    // ✅ Apply saved column layout
  applyColumnLayout(safeColumns);
  rebuildInputsAndFill(padded, safeColumns);

  const rich = document.getElementById("richTextContainer");
  if (rich) rich.style.display = "block";
  const editor = document.getElementById("editor");
  if (editor) editor.innerHTML = note || "";

  try { window.updatePreview && window.updatePreview(); } catch {}
}

function dateLabel(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function renderWorkspaceList(container, rows, onClickItem, onDeleteItem) {
  container.innerHTML = "";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "8px";
  
  const totalLists = Array.isArray(rows) ? rows.length : 0;

  header.innerHTML = `
    <strong>
      My Saved Lists <span class="saved-lists-count">(${totalLists})</span>
    </strong>
    <button id="refreshListsBtn" style="padding:4px 8px">Refresh</button>
  `;
  container.appendChild(header);

  const ul = document.createElement("ul");
  ul.classList.add("workspace-list", "active");
  ul.style.listStyle = "none";
  ul.style.paddingLeft = "0";
  ul.style.margin = "0";
  ul.style.display = "block";

  if (!rows.length) {
    const li = document.createElement("li");
    li.style.opacity = ".7";
    li.textContent = "No saved lists yet.";
    ul.appendChild(li);
  } else {
    rows.forEach(({ id, title, count, createdAt }) => {
      const li = document.createElement("li");
      li.style.marginBottom = "10px";

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.style.width = "100%";
      loadBtn.style.textAlign = "left";
      loadBtn.style.cursor = "pointer";
      loadBtn.style.padding = "6px 8px";
      loadBtn.textContent = `${title || "Untitled"} · ${count} item(s)${createdAt ? " · " + createdAt : ""}`;
      loadBtn.addEventListener("click", () => onClickItem(id));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-list-btn";
      delBtn.textContent = "×";
      delBtn.title = "Delete this list";
      delBtn.setAttribute("aria-label", "Delete this list");
      delBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onDeleteItem && onDeleteItem(id, title);
      });

      li.appendChild(loadBtn);
      li.appendChild(delBtn); // appears below the title
      ul.appendChild(li);
    });
  }

  container.appendChild(ul);

  const refresh = document.getElementById("refreshListsBtn");
  if (refresh) {
    refresh.addEventListener("click", () => {
      loadSavedLists(container.id);
    });
  }
}

function showEditorPanel() {
  const formContainer = document.getElementById("formContainer");
  const documentList = document.getElementById("documentList");
  const pdfPanel = document.getElementById("pdfViewerPanel");

  // show editor
  if (formContainer) formContainer.style.display = "block";

  // hide documents UI
  if (documentList) documentList.style.display = "none";
  if (pdfPanel) pdfPanel.style.display = "none";
}


/* ---------- Firestore reads/writes ---------- */

async function fetchRecentListsMeta(uid, max = 15) {
  const colRef = collection(db, "users", uid, "lists");
  const q = query(colRef, orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);

  const rows = [];
  snap.forEach(d => {
    const data = d.data() || {};
    rows.push({
      id: d.id,
      title: data.title || "Untitled",

      // existing
      count: Array.isArray(data.items) ? data.items.length : (data.totalItems ?? 0),
      createdAt: data.createdAt ? dateLabel(data.createdAt) : "",

      // 🔥 ADD THESE (REQUIRED)
      items: Array.isArray(data.items) ? data.items : [],
      note: data.note || "",

      // 🔥 SHARE SYSTEM
      visible: !!data.visible,
      publicId: data.publicId || ""
    });
  });
  return rows;
}

async function fetchList(uid, listId) {
  const dref = doc(db, "users", uid, "lists", listId);
  const ds = await getDoc(dref);
  return ds.exists() ? ds.data() : null;
}

async function deleteList(listId) {
  // uid is unused now but keep signature so you don’t change other calls
  await deleteListPaid({ listId });
}

/* ---------- Public API ---------- */
export function loadSavedLists(workspaceId = "workspace") {
  const container = document.getElementById(workspaceId);
  if (!container) return;

  container.innerHTML = `<div style="opacity:.7">Loading your lists…</div>`;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      container.innerHTML = `<div style="color:#a00">Please sign in to see your lists.</div>`;
      return;
    }

    // define handlers up front so we can reuse them on refresh
    const onClickItem = async (listId) => {
      try {
        const data = await fetchList(user.uid, listId);
        if (!data) {
          alert("This list could not be loaded (it may have been deleted).");
          return;
        }
        showEditorPanel();     // ✅ make sure editor is visible
        loadListIntoForm(data);

        if (validId(listId)) {
          sessionStorage.setItem('currentListId', listId);
        } else {
          sessionStorage.removeItem('currentListId');
        }

        const saveBtn = document.getElementById('saveCloudBtn');
        if (saveBtn) saveBtn.textContent = 'Update in Cloud';

        try { window.updateRowControls && window.updateRowControls(); } catch {}
      } catch (e) {
        console.error("Load list failed:", e);
        alert("Could not load that list. See console for details.");
      }
    };

    const onDeleteItem = async (listId, title) => {
      const name = title || "this list";
      if (!confirm(`Delete ${name}? This cannot be undone.`)) return;

      try {
        await deleteList(listId);

        // re-fetch and re-render after delete using the SAME handlers
        const meta2 = await fetchRecentListsMeta(user.uid, 15);

        // ✅ keep Saved Lists data in sync (no remap)
        window.allUserLists = meta2;

        renderWorkspaceList(container, meta2, onClickItem, onDeleteItem);

        // refresh Saved Lists panel if it's open
        if (typeof window.showSavedLists === "function") {
          if (typeof window.resetSavedListsPage === "function") window.resetSavedListsPage();
          window.showSavedLists();
        }
      } catch (e) {
        console.error("Delete failed:", e);
        alert("Could not delete the list. See console for details.");
      }
    };

    try {
      const meta = await fetchRecentListsMeta(user.uid, 15);
      renderWorkspaceList(container, meta, onClickItem, onDeleteItem);

      // ✅ store meta for Saved Lists view (id, title, count, createdAt)
      window.allUserLists = meta;

      // Optionally render Saved Lists now
      if (typeof window.showSavedLists === "function") {
        if (typeof window.resetSavedListsPage === "function") window.resetSavedListsPage();
        window.showSavedLists();
      }
    } catch (e) {
      console.error("Fetching lists failed:", e);
      container.innerHTML = `<div style="color:#a00">Could not load saved lists.</div>`;
    }
  });
}


// Make "Open in editor" behave like clicking a Workspace list item.
window.openListById = async function(listId) {
  try {
    const formContainer = document.getElementById("formContainer");
    const previewContainer = document.getElementById("preview-container");
    const savedListsView = document.getElementById("savedListsView");
    const documentList = document.getElementById("documentList");
    const pdfViewerPanel = document.getElementById("pdfViewerPanel");
    const myAccountPanel = document.getElementById("myAccountPanel");
    const docUploadPanel = document.getElementById("docUploadPanel");
    const shareDocPanel = document.getElementById("shareDocPanel");
    const searchBox = document.getElementById("search-box");

    if (formContainer) formContainer.style.display = "block";
    if (previewContainer) previewContainer.style.display = "block";

    if (savedListsView) savedListsView.style.display = "none";
    if (documentList) documentList.style.display = "none";
    if (pdfViewerPanel) pdfViewerPanel.style.display = "none";
    if (myAccountPanel) myAccountPanel.style.display = "none";
    if (docUploadPanel) docUploadPanel.style.display = "none";
    if (shareDocPanel) shareDocPanel.style.display = "none";
    if (searchBox) searchBox.style.display = "none";

    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to open your lists.");
      return;
    }

    // 1) Fetch the full list doc
    const data = await fetchList(user.uid, listId);
    if (!data) {
      alert("This list could not be loaded (it may have been deleted).");
      return;
    }

    // 2) Populate editor UI
    showEditorPanel();
    loadListIntoForm(data);

    // 3) Remember list id
    if (validId(listId)) {
      sessionStorage.setItem("currentListId", listId);
    } else {
      sessionStorage.removeItem("currentListId");
    }

    const saveBtn = document.getElementById("saveCloudBtn");
    if (saveBtn) saveBtn.textContent = "Update in Cloud";

    try { window.updateRowControls && window.updateRowControls(); } catch {}

    // 4) Populate Preview Container
    const title = data.title || "Untitled List";
    const items = Array.isArray(data.items) ? data.items : [];
    const note = data.note || "";
    const columns = Number(data.columns || 1);

    const headerImageUrl = data.headerImageUrl || "";
    const headerImagePath = data.headerImagePath || "";
    const footerImageUrl = data.footerImageUrl || "";
    const footerImagePath = data.footerImagePath || "";

    // Clear previous list image session state
    sessionStorage.removeItem("headerImage");
    sessionStorage.removeItem("headerImagePath");
    sessionStorage.removeItem("footerImage");
    sessionStorage.removeItem("footerImagePath");

    // Restore current list image session state
    if (headerImageUrl) sessionStorage.setItem("headerImage", headerImageUrl);
    if (headerImagePath) sessionStorage.setItem("headerImagePath", headerImagePath);
    if (footerImageUrl) sessionStorage.setItem("footerImage", footerImageUrl);
    if (footerImagePath) sessionStorage.setItem("footerImagePath", footerImagePath);

    if (typeof createItemInputs === "function") {
      createItemInputs(items.length, columns);

      const titleEl = document.getElementById("title");
      if (titleEl) titleEl.value = title;

      const inputs = document.querySelectorAll("#itemsContainer input[type='text']");
      items.forEach((val, i) => {
        if (inputs[i]) inputs[i].value = val;
      });

      const richTextContainer = document.getElementById("richTextContainer");
      const editor = document.getElementById("editor");

      if (editor) {
        editor.innerHTML = note || "";
      }

      if (richTextContainer) {
        if (note && note.trim() !== "") {
          richTextContainer.classList.add("form-note-area");
        } else {
          richTextContainer.classList.remove("form-note-area");
        }
      }
    }

    // Restore header preview
    let headerPreview = document.getElementById("headerPreview");
    if (!headerPreview && previewContainer) {
      headerPreview = document.createElement("div");
      headerPreview.id = "headerPreview";
      previewContainer.insertBefore(headerPreview, previewContainer.firstChild);
    }

    if (headerPreview) {
      if (headerImageUrl) {
        headerPreview.innerHTML = `
          <button class="remove-btn" title="Remove Header">&times;</button>
          <img src="${headerImageUrl}" alt="Header Image" crossorigin="anonymous" />
        `;

        const removeBtn = headerPreview.querySelector(".remove-btn");
        if (removeBtn) {
          removeBtn.addEventListener("click", async () => {
            const oldPath = sessionStorage.getItem("headerImagePath");

            try {
              if (oldPath) {
                const { getStorage, ref, deleteObject } = await import(
                  "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"
                );
                const storage = getStorage();
                await deleteObject(ref(storage, oldPath));
              }
            } catch (err) {
              console.warn("Could not delete header image from storage:", err);
            }

            sessionStorage.removeItem("headerImage");
            sessionStorage.removeItem("headerImagePath");
            headerPreview.innerHTML = "";
          });
        }
      } else {
        headerPreview.innerHTML = "";
      }
    }

    // Restore footer preview
    let footerPreview = document.getElementById("footerPreview");
    if (!footerPreview && previewContainer) {
      footerPreview = document.createElement("div");
      footerPreview.id = "footerPreview";
      previewContainer.appendChild(footerPreview);
    }

    if (footerPreview) {
      if (footerImageUrl) {
        footerPreview.innerHTML = `
          <button class="remove-footer-btn" title="Remove Footer">&times;</button>
          <img src="${footerImageUrl}" alt="Footer Image" crossorigin="anonymous" />
        `;

        const removeBtn = footerPreview.querySelector(".remove-footer-btn");
        if (removeBtn) {
          removeBtn.addEventListener("click", async () => {
            const oldPath = sessionStorage.getItem("footerImagePath");

            try {
              if (oldPath) {
                const { getStorage, ref, deleteObject } = await import(
                  "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"
                );
                const storage = getStorage();
                await deleteObject(ref(storage, oldPath));
              }
            } catch (err) {
              console.warn("Could not delete footer image from storage:", err);
            }

            sessionStorage.removeItem("footerImage");
            sessionStorage.removeItem("footerImagePath");
            footerPreview.innerHTML = "";
          });
        }
      } else {
        footerPreview.innerHTML = "";
      }
    }

    if (typeof updatePreview === "function") {
      updatePreview();
    }

    formContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    console.error("Open list by id failed:", e);
    alert("Could not open that list. See console for details.");
  }
};

// Allow Saved Lists view to delete by id and then refresh both panels
window.deleteListById = async function(listId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to delete lists.");
      return;
    }
    if (!confirm("Delete this list? This cannot be undone.")) return;

    await deleteList(listId);

    // Refresh workspace list (with correct handlers)
    if (typeof window.loadSavedLists === "function") {
      await window.loadSavedLists("workspace");
    }

    // Refresh Saved Lists panel
    if (typeof window.showSavedLists === "function") {
      // window.allUserLists was refreshed by loadSavedLists via meta
      window.showSavedLists();
    }
  } catch (e) {
    console.error("Delete failed:", e);
    alert("Could not delete the list. See console for details.");
  }
};

// Toggle the Workspace panel open/closed.
window.toggleWorkspace = async function () {
  const el = document.getElementById('workspace');
  if (!el) return;

  const isOpen = el.dataset.open === '1';

  if (isOpen) {
    // Close it (just hide, don’t reload)
    el.style.display = 'none';
    el.dataset.open = '0';
    return;
  }

  // Open it (show and fetch)
  el.style.display = '';
  el.innerHTML = `<div style="opacity:.7">Loading your lists…</div>`;
  el.dataset.open = '1';
  // Reuse the existing loader (renders and wires refresh/delete etc.)
  await window.loadSavedLists('workspace');
};

// Open/close the Saved Lists pane without reloading on close
// Open/close the Saved Lists pane and LOAD immediately on open
window.toggleSavedLists = async function () {
  const pane = document.getElementById('savedListsView');
  if (!pane) return;

  const isOpen = pane.dataset.open === '1';
  if (isOpen) {
    // Close: hide only
    pane.style.display = 'none';
    pane.dataset.open = '0';
    return;
  }

  // Open: show + load just like Workspace
  pane.style.display = '';
  pane.dataset.open = '1';
  pane.innerHTML = `<div style="opacity:.7">Loading your lists…</div>`;

  // ✅ Reuse the same Firestore loader but target the Saved Lists panel
  // This renders the list (title, count, delete) into #savedListsView
  await window.loadSavedLists('savedListsView');

  // (Nice touch) close Workspace if it's open
  const workspace = document.getElementById('workspace');
  if (workspace && workspace.dataset.open === '1') {
    workspace.style.display = 'none';
    workspace.dataset.open = '0';
  }
};


// Backwards compatibility so old onclick="ensureSavedLists()" still works if left anywhere
window.ensureSavedLists = window.toggleSavedLists;


// Make callable from inline onclick=""
window.loadSavedLists = loadSavedLists;

/* ---------- Documents list loader ---------- */
/* ---------- Documents list loader ---------- */

// List user's uploaded documents with Visible checkbox + Open + Delete
async function loadUserDocuments() {
  const user = auth.currentUser;
  const listDiv = document.getElementById("documentList");
  if (!user || !listDiv) return;

  listDiv.innerHTML = `<div style="opacity:.7">Loading your documents…</div>`;

  try {
    const docsRef = collection(db, "users", user.uid, "documents");
    const qDocs = query(docsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(qDocs);

    let html = `
    <h3>Your Documents</h3>
    <div class="documents-table-wrap">
      <table class="documents-table" style="width:100%; border-collapse:collapse; font-size:0.95rem;">
        <thead>
          <tr style="background:#f3f3f3; text-align:left;">
            <th style="padding:8px; border-bottom:1px solid #ddd;">Visible / ID</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; min-width:240px;">Title</th>
            <th style="padding:8px; border-bottom:1px solid #ddd;">Uploaded</th>
            <th style="padding:8px; border-bottom:1px solid #ddd;">View</th>
            <th style="padding:8px; border-bottom:1px solid #ddd;">Share</th>
            <th style="padding:8px; border-bottom:1px solid #ddd;">Delete</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (snap.empty) {
      html += `
        <tr>
          <td colspan="6" style="padding:10px; opacity:.7;">No documents uploaded yet.</td>
        </tr>
      `;
    } else {
      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        const title = d.title || d.filename || "Untitled document";
        // const filename = d.filename || "(no file)";
        const created = d.createdAt?.toDate
          ? d.createdAt.toDate().toLocaleString()
          : "(unknown)";

        // default unchecked unless visible === 1 or true or "YES"
        const isVisible = d.visible === true;

        // escape single quotes for inline onclick strings
        const downloadURL = (d.downloadURL || "").replace(/'/g, "\\'");
        // const storagePath = (d.storagePath || "").replace(/'/g, "\\'");

        html += `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px; white-space:nowrap;">
              <label style="display:inline-flex; align-items:center; gap:8px;">
                <input
                  type="checkbox"
                  ${isVisible ? "checked" : ""}
                  onchange="toggleDocVisible('${docSnap.id}', this.checked)"
                />
                <span style="font-size:0.85rem; opacity:.8;">
                ${d.publicId ? d.publicId : ""}
                </span>
                ${d.publicId ? `
                <button
                  title="Copy share link"
                  onclick="copyDocLink('${d.publicId}')"
                  style="
                    border:none;
                    background:none;
                    cursor:pointer;
                    font-size:16px;
                    margin-left:6px;
                  "
                >
                📋
                </button>
                ` : ""}
              </label>
            </td>
            <td style="padding:8px;min-width:220px;">
              <div class="doc-title-inline">

                <span
                  class="doc-title-text"
                  id="docTitleText-${docSnap.id}"
                >
                  ${title}
                </span>

                <button
                  type="button"
                  class="rename-pencil-btn"
                  title="Rename document"
                  onclick="startInlineRename('${docSnap.id}', '${title.replace(/'/g, "\\'")}')"
                >
                  ✏️
                </button>

                <div
                  class="doc-title-editor"
                  id="docTitleEditor-${docSnap.id}"
                  style="display:none;"
                >
                  <input
                    type="text"
                    id="docTitleInput-${docSnap.id}"
                    value="${title.replace(/"/g, "&quot;")}"
                  />

                  <button onclick="saveInlineRename('${docSnap.id}')">
                    Save
                  </button>

                  <button onclick="cancelInlineRename('${docSnap.id}')">
                    Cancel
                  </button>

                </div>

              </div>
            </td>
            <td style="padding:8px; white-space:nowrap;">${created}</td>
            <td style="padding:8px;">
              ${
                d.downloadURL
                  ? `<button type="button" onclick="openPdf('${downloadURL}')">Open</button>`
                  : `<span style="opacity:.6;">No URL</span>`
              }
            </td>

            <td style="padding:8px;">
              ${
                d.publicId
                  ? `<button
                      type="button"
                      onclick="openShareDocForm('${docSnap.id}', '${title.replace(/'/g, "\\'")}', '${d.publicId}')"
                    >
                      Share
                    </button>`
                  : `<span style="opacity:.6;" class="private-badge">Private</span>`
              }
            </td>

            <td style="padding:8px;">
              <button
                type="button"
                style="color:#a00;"
                onclick="deleteUserDocument('${docSnap.id}')"
              >
                Delete
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div>`;
    listDiv.innerHTML = html;
  } catch (e) {
    console.error("Failed to load documents:", e);
    listDiv.innerHTML = `<div style="color:#a00;">Could not load your documents.</div>`;
  }
}

// Toggle visibility with persistent publicId + public index doc
window.toggleDocVisible = async function (docId, checked) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first.");
    return;
  }

  try {
    const res = await toggleDocumentVisibility({
      docId,
      visible: !!checked,
    });

    const publicId = res?.data?.publicId;

    // ✅ If turned ON and ID exists → copy automatically
    if (checked && publicId) {
      try {
        await navigator.clipboard.writeText(`https://lysty.co/doc/${publicId}`);
        showToast(`Link to Document with Code ${publicId} copied`);
      } catch (err) {
        console.warn("Clipboard copy failed:", err);
      }
    }

    await loadUserDocuments();
  } catch (e) {
    console.error("toggleDocVisible failed:", e);
    alert("Could not update visibility.");

    await loadUserDocuments();
  }
};

window.copyDocLink = async function(publicId) {
  const link = `https://lysty.co/doc/${publicId}`;

  try {
    await navigator.clipboard.writeText(link);

    if (window.showToast) {
      window.showToast("Link copied to clipboard");
    } else {
      alert("Link copied:\n" + link);
    }

  } catch (err) {
    console.error("Clipboard copy failed:", err);

    // fallback for older browsers
    const temp = document.createElement("input");
    temp.value = link;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);

    alert("Link copied:\n" + link);
  }
};

// Delete document from Storage and Firestore
window.deleteUserDocument = async function (docId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first.");
    return;
  }

  if (!confirm("Delete this document? This cannot be undone.")) return;

  try {
    // ✅ server does: delete Firestore meta, decrement usage.docCount, and best-effort delete storage file
    const res = await deleteDocumentPaid({ docId });
    console.log("deleteDocumentPaid:", res?.data);

    await loadUserDocuments();
  } catch (e) {
    console.error("Delete document failed:", e);
    alert("Could not delete the document. See console for details.");
  }
};

window.startInlineRename = function (docId, currentTitle) {
  const textEl = document.getElementById(`docTitleText-${docId}`);
  const editorEl = document.getElementById(`docTitleEditor-${docId}`);
  const inputEl = document.getElementById(`docTitleInput-${docId}`);

  if (textEl) textEl.style.display = "none";
  if (editorEl) editorEl.style.display = "inline-flex";
  if (inputEl) {
    inputEl.value = currentTitle || "";
    inputEl.focus();
    inputEl.select();
  }

  inputEl.onkeydown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await window.saveInlineRename(docId);
    }

    if (e.key === "Escape") {
      e.preventDefault();
      window.cancelInlineRename(docId);
    }
  };
};

window.cancelInlineRename = function (docId) {
  const textEl = document.getElementById(`docTitleText-${docId}`);
  const editorEl = document.getElementById(`docTitleEditor-${docId}`);

  if (textEl) textEl.style.display = "inline";
  if (editorEl) editorEl.style.display = "none";
};

window.saveInlineRename = async function (docId) {
  const inputEl = document.getElementById(`docTitleInput-${docId}`);
  const newTitle = inputEl?.value?.trim();

  if (!newTitle) {
    alert("Title cannot be empty.");
    return;
  }

  try {
    await renameDocumentTitle({
      docId,
      title: newTitle
    });

    await loadUserDocuments();

    if (window.showToast) {
      window.showToast("Document renamed");
    }

  } catch (e) {
    console.error("Inline rename failed:", e);
    alert("Could not rename document.");
  }
};

window.openShareDocForm = function (docId, title, publicId) {
  const panel = document.getElementById("shareDocPanel");
  const docIdEl = document.getElementById("shareDocId");
  const publicIdEl = document.getElementById("sharePublicId");
  const titleEl = document.getElementById("shareDocTitle");
  const emailEl = document.getElementById("shareRecipientEmail");
  const msgEl = document.getElementById("shareEmailMessage");
  const statusEl = document.getElementById("shareDocStatus");

  if (!panel) return;

  if (docIdEl) docIdEl.value = docId || "";
  if (publicIdEl) publicIdEl.value = publicId || "";
  if (titleEl) titleEl.value = title || "";
  if (emailEl) emailEl.value = "";
  if (msgEl) msgEl.value = "Document shared using lysty.co";
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.style.color = "#333";
  }

  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

  if (emailEl) emailEl.focus();
};

window.closeShareDocForm = function () {
  const panel = document.getElementById("shareDocPanel");
  const form = document.getElementById("shareDocForm");
  const statusEl = document.getElementById("shareDocStatus");

  if (panel) panel.style.display = "none";
  if (form) form.reset();
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.style.color = "#333";
  }
};

const shareDocCancelBtn = document.getElementById("shareDocCancelBtn");

if (shareDocCancelBtn) {
  shareDocCancelBtn.addEventListener("click", () => {
    window.closeShareDocForm();
  });
}

// share document function while js for sharing the document is written
const shareDocForm = document.getElementById("shareDocForm");

if (shareDocForm) {
  shareDocForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const docId = document.getElementById("shareDocId")?.value || "";
    const publicId = document.getElementById("sharePublicId")?.value || "";
    const title = document.getElementById("shareDocTitle")?.value || "";
    const email = document.getElementById("shareRecipientEmail")?.value?.trim() || "";
    const message = document.getElementById("shareEmailMessage")?.value?.trim() || "";
    const statusEl = document.getElementById("shareDocStatus");
    const sendBtn = document.getElementById("sendShareEmailBtn");

    if (!docId || !publicId || !email) {
      if (statusEl) {
        statusEl.textContent = "Please enter an email.";
        statusEl.style.color = "#a00";
      }
      return;
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Sending...";
      }

      if (statusEl) {
        statusEl.textContent = "Sending email...";
        statusEl.style.color = "#333";
      }

      await sendDocumentShareEmail({
        docId,
        to: email,
        message
      });

      if (statusEl) {
        statusEl.textContent = `Document "${title}" sent to ${email}.`;
        statusEl.style.color = "#0a0";
      }

      if (window.showToast) {
        window.showToast("Share email sent");
      }
    } catch (err) {
      console.error("Share email failed:", err);

      const msg =
        err?.message ||
        err?.details?.message ||
        "Could not send email.";

      if (statusEl) {
        statusEl.textContent = msg;
        statusEl.style.color = "#a00";
      }
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Email";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const openListId = params.get("openListId");

  if (!openListId) return;

  const waitForEditor = setInterval(async () => {
    if (auth.currentUser && typeof window.openListById === "function") {
      clearInterval(waitForEditor);
      await window.openListById(openListId);

      // clean the URL after opening
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, 300);
});

// Expose as global so auth.html can call window.loadUserDocuments()
window.loadUserDocuments = loadUserDocuments;