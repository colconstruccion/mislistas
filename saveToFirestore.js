// saveToFirestore.js  (load with: <script type="module" src="saveToFirestore.js"></script>)

import { auth, db } from "./firebaseConfig.js?v=4";
import { doc, updateDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

import { readSignupListSettingsFromDOM } from "./saveSignUpList.js?v=1";

const functions = getFunctions();
const createListPaid = httpsCallable(functions, "createListPaid");

function readListFromDOM() {
  const titleEl = document.getElementById("title");

  const allInputs = Array.from(
    document.querySelectorAll("#itemsContainer input[name='item'], #itemsContainer textarea")
  );

  const title = (titleEl?.value || "").trim() || "Untitled List";

  const noteBox = document.getElementById("form-note") || document.getElementById("editor");
  const note = noteBox
    ? (noteBox.value ?? noteBox.textContent ?? noteBox.innerHTML ?? "").toString().trim()
    : "";

  const sessionId = sessionStorage.getItem("sessionId") || null;

  const columns = currentColumns || 1;
  const safeColumns = [1, 2, 3].includes(Number(columns)) ? Number(columns) : 1;

  const dateColumnEnabled =
  typeof window.getDateColumnEnabled === "function"
    ? window.getDateColumnEnabled()
    : false;

  const {
    signupEnabled,
    signupVisibility,
    signupFields
  } = readSignupListSettingsFromDOM();

  let items = allInputs.map((inp) => {
    const rawValue = (inp?.value || "").trim();
    const link = (inp?.dataset?.link || "").trim();
    const rating = Math.max(0, Math.min(5, Number(inp?.dataset?.rating || 0)));

    const isDateInput = inp.type === "date";
    const looksLikeDate = /^\d{4}-\d{2}-\d{2}$/.test(rawValue);

    if (isDateInput || looksLikeDate) {
      return {
        text: "",
        link: "",
        rating: 0,
        date: rawValue
      };
    }

    return {
      text: rawValue.toLowerCase() === "on" ? "" : rawValue,
      link,
      rating,
      date: ""
    };
  });

  // remove only trailing completely empty cells
  while (
    items.length > 0 &&
    items[items.length - 1].text === "" &&
    items[items.length - 1].link === "" &&
    Number(items[items.length - 1].rating || 0) === 0 &&
    (items[items.length - 1].date || "") === ""
  ) {
    items.pop();
  }

  // pad back to complete the final row
  while (safeColumns > 1 && items.length % safeColumns !== 0) {
    items.push({ text: "", link: "", rating: 0, date: "" });
  }

  const headerImageUrl = sessionStorage.getItem("headerImage") || "";
  const headerImagePath = sessionStorage.getItem("headerImagePath") || "";
  const footerImageUrl = sessionStorage.getItem("footerImage") || "";
  const footerImagePath = sessionStorage.getItem("footerImagePath") || "";

  return {
    title,
    items,
    note,
    sessionId,
    columns: safeColumns,
    dateColumnEnabled,
    headerImageUrl,
    headerImagePath,
    footerImageUrl,
    footerImagePath,
    signupEnabled,
    signupVisibility,
    signupFields
  };
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

  const {
    title,
    items,
    note,
    sessionId,
    columns,
    dateColumnEnabled,
    headerImageUrl,
    headerImagePath,
    footerImageUrl,
    footerImagePath,
    signupEnabled,
    signupVisibility,
    signupFields
  } = readListFromDOM();

  if (!items || items.length === 0) {
    alert("Please add at least one item before saving.");
    return;
  }

  try {
    const existingIdRaw = sessionStorage.getItem("currentListId");
    const existingId = validId(existingIdRaw) ? existingIdRaw : null;

    if (existingId) {
      const dref = doc(db, "users", user.uid, "lists", existingId);
      // 🔥 First read current priority
      const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

      const snap = await getDoc(dref);
      const existingPriority = snap.exists() ? snap.data().priority === true : false;

      await updateDoc(dref, {
        title,
        items,
        note,
        sessionId,
        columns,
        dateColumnEnabled,
        headerImageUrl,
        headerImagePath,
        footerImageUrl,
        footerImagePath,
        totalItems: items.length,
        priority: existingPriority, // ✅ PRESERVE
        updatedAt: serverTimestamp(),
        signupEnabled,
        signupVisibility,
        signupFields
      });

      alert("List updated in Cloud Firestore ✔");
      return;
    }

    const res = await createListPaid({
      title,
      items,
      note,
      sessionId,
      columns,
      dateColumnEnabled,
      headerImageUrl,
      headerImagePath,
      footerImageUrl,
      footerImagePath,
      totalItems: items.length,
      signupEnabled,
      signupVisibility,
      signupFields,
    });

    console.log("Saving list image fields:", {
      headerImageUrl,
      headerImagePath,
      footerImageUrl,
      footerImagePath
    });

    const newId = res?.data?.listId;

    if (validId(newId)) {
      sessionStorage.setItem("currentListId", newId);
    }

    const saveBtn = document.getElementById("saveCloudBtn");
    if (saveBtn) {
        saveBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM6 8V5h9v3H6z"></path>
          </svg>
        `;
        saveBtn.title = "Save to Cloud";
        saveBtn.setAttribute("aria-label", "Save to Cloud");
      }

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

export function wireSaveButton(btnId = "saveCloudBtn") {
  const btn = document.getElementById(btnId);
  if (btn) btn.addEventListener("click", saveListToCloud);

  const copyBtn = document.getElementById("saveAsCopyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      sessionStorage.removeItem("currentListId");
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

document.addEventListener("DOMContentLoaded", () => {
  wireSaveButton();
});