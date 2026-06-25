import { app, auth, db } from "./firebaseConfig.js?v=4";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const functions = getFunctions(app);
const cloneSharedListToUser = httpsCallable(functions, "cloneSharedListToUser");

let stopSharedListListener = null;

function getPublicIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryId = (params.get("id") || "").trim();

  if (queryId) {
    return queryId;
  }

  const parts = window.location.pathname.split("/").filter(Boolean);

  // supports /list/ZSD4
  if (parts.length >= 2 && parts[0] === "list") {
    return parts[1];
  }

  return "";
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatSharedDate(dateStr) {
  if (!dateStr) return "";

  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function renderSharedItemText(item) {
  const text = escapeHtml(item?.text || "");
  const link = typeof item?.link === "string" ? item.link.trim() : "";
  const date = item?.date || "";

  // ✅ PRIORITY 1: DATE
  if (date) {
    return `<span class="shared-date">${formatSharedDate(date)}</span>`;
  }

  // ✅ PRIORITY 2: LINK
  if (link && text) {
    const safeLink = escapeHtml(link);
    return `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  }

  // ✅ DEFAULT TEXT
  return text;
}

function normalizeItems(items = []) {
  return items.map((item) => {
    if (typeof item === "string") {
      return {
        text: item,
        link: "",
        checked: false,
        rating: 0
      };
    }

    return {
      text: item?.text || "",
      link: item?.link || "",
      date: item?.date || "",
      checked: !!item?.checked,
      rating: Math.max(0, Math.min(5, Number(item?.rating || 0)))
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

function getSignupFields(data = {}) {
  return Array.isArray(data.signupFields) && data.signupFields.length
    ? data.signupFields
    : ["Name", "Email", "Phone"];
}

function removeExistingSignupForm() {
  const existing = document.getElementById("publicSignupFormWrap");
  if (existing) existing.remove();
}

function renderSignupForm(data, publicId) {
  removeExistingSignupForm();

  if (data.signupEnabled !== true) return;

  const card = document.querySelector(".shared-card");
  if (!card) return;

  const labels = getSignupFields(data);
  const fieldKeys = ["name", "email", "phone"];

  const wrap = document.createElement("div");
  wrap.id = "publicSignupFormWrap";
  wrap.className = "shared-note";
  wrap.innerHTML = `
    <h3>Sign up</h3>
    <form id="publicSignupForm">
      ${labels.map((field, index) => `
        <div style="margin-bottom:10px;">
          <label for="signupField${index}" style="display:block; font-weight:600; margin-bottom:4px;">
            ${escapeHtml(field)}
          </label>
          <input
            id="signupField${index}"
            name="${fieldKeys[index] || `field${index}`}"
            type="text"
            required
            style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px; box-sizing:border-box;"
          >
        </div>
      `).join("")}

      <button type="submit" style="padding:10px 14px; border-radius:8px; border:none; cursor:pointer;">
        Sign Up
      </button>

      <div id="publicSignupStatus" style="margin-top:10px;"></div>
    </form>
  `;

  card.appendChild(wrap);

  const form = document.getElementById("publicSignupForm");
  if (!form) return;

  // Automatically place the cursor in the first field
  requestAnimationFrame(() => {
    const firstInput = document.getElementById("signupField0");

    if (firstInput) {
      firstInput.focus();
      firstInput.select();   // optional: selects existing text if any
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const statusEl = document.getElementById("publicSignupStatus");
    const submitBtn = form.querySelector("button[type='submit']");

    const values = {};

    labels.forEach((label, index) => {
      const key = fieldKeys[index] || `field${index}`;
      const input = document.getElementById(`signupField${index}`);

      values[key] = (input?.value || "").trim();
    });

    const emailValue = values.email || "";

    if (emailValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(emailValue)) {
        if (statusEl) {
          statusEl.textContent = "Please enter a valid email address.";
          statusEl.style.color = "#a00";
        }
        return;
      }
    }

    const phoneValue = values.phone || "";

    if (phoneValue) {
      const phoneRegex = /^[0-9+\-\s()]+$/;

      if (!phoneRegex.test(phoneValue)) {
        if (statusEl) {
          statusEl.textContent =
            "Phone number can only contain numbers, spaces, (), + and -";
          statusEl.style.color = "#a00";
        }
        return;
      }
    }

    if (!values.name) {
      statusEl.textContent = "Please enter your name.";
      statusEl.style.color = "#a00";
      return;
      }

    if (!values.email) {
        statusEl.textContent = "Please enter your email.";
        statusEl.style.color = "#a00";
        return;
      }

    if (!values.phone) {
        statusEl.textContent = "Please enter your phone number.";
        statusEl.style.color = "#a00";
        return;
      }

    const hasAnyValue = Object.values(values).some(Boolean);

    if (!hasAnyValue) {
      if (statusEl) {
        statusEl.textContent = "Please enter your information.";
        statusEl.style.color = "#a00";
      }
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
      }

      await addDoc(collection(db, "publicListSignups"), {
        publicId,
        ownerUid: data.ownerUid || "",
        sourceListId: data.sourceListId || "",
        values,
        signupVisibility: data.signupVisibility || "private",
        createdAt: serverTimestamp()
      });

      localStorage.setItem(`signedUp_${publicId}`, "true");

      form.reset();

      if (statusEl) {
        statusEl.textContent = "Thank you. Your signup has been received.";
        statusEl.style.color = "#0a0";
      }
    } catch (err) {
      console.error("Signup failed:", err);

      if (statusEl) {
        statusEl.textContent = "Could not save your signup. Please try again.";
        statusEl.style.color = "#a00";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
      }
    }
  });
}

function renderList(data, publicId) {
  const titleEl = document.getElementById("sharedListTitle");
  const metaEl = document.getElementById("sharedMeta");
  const listEl = document.getElementById("sharedListItems");
  const noteWrap = document.getElementById("sharedNoteWrap");
  const noteBody = document.getElementById("sharedNoteBody");
  const errorEl = document.getElementById("sharedError");
  const headerWrap = document.getElementById("sharedHeaderImageWrap");
  const headerImg = document.getElementById("sharedHeaderImage");
  const footerWrap = document.getElementById("sharedFooterImageWrap");
  const footerImg = document.getElementById("sharedFooterImage");

  if (errorEl) errorEl.style.display = "none";
  if (titleEl) titleEl.textContent = data.title || "Shared List";

  const rawItems = normalizeItems(data.items || []);
  const columns = Number(data.columns || 1);
  const safeColumns = [1, 2, 3].includes(columns) ? columns : 1;
  const items = padItemsToColumns(rawItems, safeColumns);

  if (metaEl) {
    metaEl.textContent = `Code: ${publicId}${rawItems.length ? ` · ${rawItems.length} item(s)` : ""}`;
  }

  if (headerWrap && headerImg) {
    if (data.headerImageUrl) {
      headerImg.src = data.headerImageUrl;
      headerWrap.style.display = "block";
    } else {
      headerImg.removeAttribute("src");
      headerWrap.style.display = "none";
    }
  }

  if (footerWrap && footerImg) {
    if (data.footerImageUrl) {
      footerImg.src = data.footerImageUrl;
      footerWrap.style.display = "block";
    } else {
      footerImg.removeAttribute("src");
      footerWrap.style.display = "none";
    }
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

        const starsHtml = item.rating > 0
          ? `<div class="shared-item-stars">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</div>`
          : "";

        li.innerHTML = `
          <label class="shared-item-label">
            <input
              type="checkbox"
              class="shared-item-checkbox ${item.checked ? "is-checked" : "is-unchecked"}"
              ${item.checked ? "checked" : ""}
              data-index="${index}"
            >
            <div class="shared-item-content">
              <div class="shared-item-text">${renderSharedItemText(item)}</div>
              ${starsHtml}
            </div>
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

        const linkEl = li.querySelector(".shared-item-text a");
        if (linkEl) {
          linkEl.addEventListener("click", (e) => {
            e.stopPropagation();
          });
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

  renderSignupForm(data, publicId);
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

  const prettyUrl = `${window.location.origin}/list/${encodeURIComponent(publicId)}`;
    if (window.location.href !== prettyUrl) {
      window.history.replaceState({}, "", prettyUrl);
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