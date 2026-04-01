import { auth } from "./firebaseConfig.js?v=4";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const functions = getFunctions();
const shareListCallable = httpsCallable(functions, "shareList");
const unshareListCallable = httpsCallable(functions, "unshareList");

window.toggleShareList = async function toggleShareList(listId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first.");
    return;
  }

  const allLists = Array.isArray(window.allUserLists) ? window.allUserLists : [];
  const listObj = allLists.find(l => l.id === listId);

  if (!listObj) {
    alert("List not found.");
    return;
  }

  try {
    if (listObj.visible && listObj.publicId) {
      await unshareListCallable({
        listId,
        publicId: listObj.publicId
      });

      // update local cache immediately
      listObj.visible = false;

      alert("List unshared.");
    } else {
      const res = await shareListCallable({ listId });
      const publicId = res?.data?.publicId || "";

      // update local cache immediately
      listObj.visible = true;
      listObj.publicId = publicId;

      alert(`List shared. Code: ${publicId}`);
    }

    // re-render Saved Lists immediately from updated cache
    if (typeof window.showSavedLists === "function") {
      window.showSavedLists();
    }

    // refresh workspace list in background
    if (typeof window.loadSavedLists === "function") {
      window.loadSavedLists("workspace");
    }
  } catch (err) {
    console.error("Share toggle failed:", err);
    alert(err?.message || "Could not change share status.");
  }
};

window.copyListShareLink = async function copyListShareLink(publicId) {
  const url = `${location.origin}/list/${publicId}`;

  try {
    await navigator.clipboard.writeText(url);
    alert("Link copied.");
  } catch (err) {
    console.error("Copy failed:", err);
    prompt("Copy this link:", url);
  }
};

window.openSharedList = function (publicId) {
  const url = `${window.location.origin}/list/${publicId}`;
  window.open(url, "_blank");
};