// saveToFirestore.js  (load with: <script type="module" src="saveToFirestore.js"></script>)

// ✅ Use the initialized instances from firebaseConfig.js (Option B)
// saveToFirestore.js
import { auth, db } from "./firebaseConfig.js?v=4";  // match the query
import { doc, updateDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const functions = getFunctions();
const createListPaid = httpsCallable(functions, "createListPaid");


// --- Read the current list from the DOM ---
// Grabs title, ALL inputs inside #itemsContainer, an optional note, and sessionId.
function readListFromDOM() {
  const titleEl = document.getElementById("title");
  // Only grab text-like inputs (ignore row checkboxes)
  const allInputs = Array.from(
  document.querySelectorAll("#itemsContainer input[type='text'], #itemsContainer textarea"));


  const title = (titleEl?.value || "").trim() || "Untitled List";

  // Collect ALL rows; keep only non-empty strings
  const items = allInputs
  .map(inp => (inp?.value || "").trim())
  .filter(v => v !== "" && v.toLowerCase() !== "on");

  // Optional note box: supports <textarea id="form-note"> or <div id="editor" contenteditable>
  const noteBox = document.getElementById("form-note") || document.getElementById("editor");
  const note = noteBox
    ? (noteBox.value ?? noteBox.textContent ?? noteBox.innerHTML ?? "").toString().trim()
    : "";

  // Reuse your existing session id if you set it elsewhere
  const sessionId = sessionStorage.getItem("sessionId") || null;

  // Detect selected column layout
  const columns = currentColumns || 1;

  return { title, items, note, sessionId, columns };
}

function validId(id) {
  return typeof id === "string" && id.length > 0 && id !== "undefined";
}

export async function saveListToCloud() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in with Google first.");
    return;
  }

  const { title, items, note, sessionId, columns } = readListFromDOM();
  if (!items || items.length === 0) {
    alert("Please add at least one item before saving.");
    return;
  }

  try {
    const existingIdRaw = sessionStorage.getItem("currentListId");
    const existingId = validId(existingIdRaw) ? existingIdRaw : null;

    if (existingId) {
      // ✅ UPDATE existing list (still client-side)
      const dref = doc(db, "users", user.uid, "lists", existingId);
      await updateDoc(dref, {
        title,
        items,
        note,
        sessionId,
        columns,
        totalItems: items.length,
        updatedAt: serverTimestamp(),
      });

      alert("List updated in Cloud Firestore ✔");
      return;
    }

    // ✅ CREATE new list (billing-enforced via Cloud Function)
    const res = await createListPaid({
      title,
      items,
      note,
      sessionId,
      columns,
      totalItems: items.length,
    });

    const newId = res?.data?.listId;

    if (validId(newId)) {
      sessionStorage.setItem("currentListId", newId);
    }

    const saveBtn = document.getElementById("saveCloudBtn");
    if (saveBtn) saveBtn.textContent = "Update in Cloud";

    alert("List saved to Cloud Firestore ✔");
  } catch (err) {
    console.error("Save failed:", err);

    const msg =
      err?.code === "functions/resource-exhausted"
        ? "You’ve used your 10 free lists. Please buy points to create more lists."
        : (err?.message || "Could not save the list. See console for details.");

    alert(msg);
  }
}


// --- Wire the "Save to Cloud" button and auth state ---
export function wireSaveButton(btnId = "saveCloudBtn") {
  const btn = document.getElementById(btnId);
  if (btn) btn.addEventListener("click", saveListToCloud);

  const copyBtn = document.getElementById("saveAsCopyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      sessionStorage.removeItem('currentListId'); // force new doc
      await saveListToCloud();
    });
  }

  onAuthStateChanged(auth, (user) => {
    const signedIn = !!user;
    if (btn) {
      btn.disabled = !signedIn;
      btn.title = signedIn ? "Save this list to your cloud" : "Sign in to save";
    }
    if (copyBtn) {
      copyBtn.disabled = !signedIn;
      copyBtn.title = signedIn ? "Save a duplicate copy" : "Sign in to save";
    }
  });
}



// Auto-wire on DOM ready (safe no-op if button not present)
document.addEventListener("DOMContentLoaded", () => {
  wireSaveButton();
});
