import { app, auth, db } from "./firebaseConfig.js?v=4";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const functions = getFunctions(app);
const cloneSharedListToUser = httpsCallable(functions, "cloneSharedListToUser");

let stopSharedListListener = null;

function getPublicIdFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[1] || "";
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeItems(items = []) {
  return items.map((item) => {
    if (typeof item === "string") {
      return { text: item, checked: false };
    }

    return {
      text: item?.text || "",
      checked: !!item?.checked
    };
  });
}

function setLoading(isLoading) {
  const loadingEl = document.getElementById("sharedLoading");
  const listEl = document.getElementById("sharedListItems");

  if (loadingEl) loadingEl.style.display = isLoading ? "block" : "none";
  if (listEl) listEl.style.display = isLoading ? "none" : "grid";
}

function showError(message) {
  const errorEl = document.getElementById("sharedError");
  const loadingEl = document.getElementById("sharedLoading");
  const listEl = document.getElementById("sharedListItems");
  const noteWrap = document.getElementById("sharedNoteWrap");

  if (loadingEl) loadingEl.style.display = "none";
  if (listEl) listEl.style.display = "none";
  if (noteWrap) noteWrap.style.display = "none";

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}

function padItemsToColumns(items = [], columns = 1) {
  const padded = [...items];

  while (columns > 1 && padded.length % columns !== 0) {
    padded.push({
      text: "",
      checked: false,
      isPlaceholder: true
    });
  }

  return padded;
}

function renderList(data, publicId) {
  const titleEl = document.getElementById("sharedListTitle");
  const metaEl = document.getElementById("sharedMeta");
  const listEl = document.getElementById("sharedListItems");
  const noteWrap = document.getElementById("sharedNoteWrap");
  const noteBody = document.getElementById("sharedNoteBody");
  const errorEl = document.getElementById("sharedError");

  if (errorEl) errorEl.style.display = "none";
  if (titleEl) titleEl.textContent = data.title || "Shared List";

  const rawItems = normalizeItems(data.items || []);
  const columns = Number(data.columns || 1);
  const safeColumns = [1, 2, 3].includes(columns) ? columns : 1;
  const items = padItemsToColumns(rawItems, safeColumns);

  if (metaEl) {
    metaEl.textContent = `Code: ${publicId}${rawItems.length ? ` · ${rawItems.length} item(s)` : ""}`;
  }

  if (listEl) {
    listEl.innerHTML = "";
    listEl.className = `shared-list cols-${safeColumns}`;

    if (!rawItems.length) {
      listEl.innerHTML = `<li class="shared-empty">This list has no items.</li>`;
    } else {
      items.forEach((item, index) => {
        const li = document.createElement("li");

        if (item.isPlaceholder) {
          li.className = "shared-item shared-placeholder";
          li.innerHTML = `<div class="shared-item-text">&nbsp;</div>`;
          listEl.appendChild(li);
          return;
        }

        li.className = `shared-item${item.checked ? " completed" : ""}`;

        li.innerHTML = `
          <label class="shared-item-label">
            <input
              type="checkbox"
              class="shared-item-checkbox ${item.checked ? "is-checked" : "is-unchecked"}"
              ${item.checked ? "checked" : ""}
              data-index="${index}"
            >
            <div class="shared-item-text">${escapeHtml(item.text)}</div>
          </label>
        `;

        const checkbox = li.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.addEventListener("change", async (e) => {
            await updateSharedCheckbox(publicId, index, e.target.checked);
          });
        }

        const label = li.querySelector(".shared-item-label");
        if (label) {
          label.style.cursor = "pointer";
        }

        listEl.appendChild(li);
      });
    }
  }

  const note = typeof data.note === "string" ? data.note.trim() : "";
  if (note && noteWrap && noteBody) {
    noteBody.innerHTML = data.note;
    noteWrap.style.display = "block";
  } else if (noteWrap) {
    noteWrap.style.display = "none";
  }

  wireSaveSharedCopyButton(publicId);
  setLoading(false);
}

async function updateSharedCheckbox(publicId, index, checked) {
  try {
    const ref = doc(db, "publicLists", publicId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data() || {};
    const items = normalizeItems(data.items || []);

    if (!items[index]) return;

    items[index].checked = !!checked;

    await updateDoc(ref, {
      items,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to update shared checkbox:", err);
    alert("Could not save the checkbox change.");
  }
}

function wireSaveSharedCopyButton(publicId) {
  const btn = document.getElementById("saveSharedCopyBtn");
  if (!btn) return;

  btn.style.display = "inline-flex";

  btn.onclick = async () => {
    try {
      // not signed in -> send to login
      if (!auth.currentUser) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?returnTo=${returnTo}`;
        return;
      }

      btn.disabled = true;
      btn.textContent = "Saving copy...";

      const res = await cloneSharedListToUser({ publicId });
      const newListId = res?.data?.listId;

      if (!newListId) {
        throw new Error("No list ID returned.");
      }

      window.location.href = `/auth.html?openListId=${encodeURIComponent(newListId)}`;
    } catch (err) {
      console.error("Failed to save shared copy:", err);

      if (err?.code === "functions/unauthenticated") {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?returnTo=${returnTo}`;
        return;
      }

      alert("Could not save a copy of this list.");
      btn.disabled = false;
      btn.textContent = "Save as Copy";
    }
  };
}

function loadSharedList() {
  const publicId = getPublicIdFromUrl();

  if (!publicId) {
    showError("Missing list code.");
    return;
  }

  setLoading(true);

  const ref = doc(db, "publicLists", publicId);

  if (stopSharedListListener) {
    stopSharedListListener();
    stopSharedListListener = null;
  }

  stopSharedListListener = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        showError("This shared list was not found or is no longer available.");
        return;
      }

      renderList(snap.data() || {}, publicId);
    },
    (err) => {
      console.error("Failed to listen to shared list:", err);
      showError("Could not load the shared list.");
    }
  );
}

window.addEventListener("beforeunload", () => {
  if (stopSharedListListener) {
    stopSharedListListener();
    stopSharedListListener = null;
  }
});

loadSharedList();