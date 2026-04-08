import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const db = getFirestore();
const VAULT_TEST_STRING = "lysty-vault-verifier";

function getVaultSessionKeyName(uid) {
  return `lystyVaultKey:${uid}`;
}

window.clearVaultSession = function clearVaultSession() {
  const auth = window._firebase?.auth;
  const uid = auth?.currentUser?.uid;
  if (!uid) return;
  sessionStorage.removeItem(getVaultSessionKeyName(uid));
};

window.getVaultKeyFromSession = function getVaultKeyFromSession() {
  const auth = window._firebase?.auth;
  const uid = auth?.currentUser?.uid;
  if (!uid) return "";
  return sessionStorage.getItem(getVaultSessionKeyName(uid)) || "";
};

window.setVaultKeyInSession = function setVaultKeyInSession(vaultKey) {
  const auth = window._firebase?.auth;
  const uid = auth?.currentUser?.uid;
  if (!uid) return;
  sessionStorage.setItem(getVaultSessionKeyName(uid), vaultKey);
};

window.getVaultMeta = async function getVaultMeta() {
  const auth = window._firebase?.auth;
  const user = auth?.currentUser;
  if (!user) throw new Error("User not signed in.");

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  const data = snap.data() || {};

  return {
    userRef,
    vaultConfigured: data.vaultConfigured === true,
    vaultVerifierEncrypted: data.vaultVerifierEncrypted || "",
    vaultVerifierIv: data.vaultVerifierIv || "",
    vaultVerifierSalt: data.vaultVerifierSalt || ""
  };
};

window.createVaultVerifier = async function createVaultVerifier(vaultKey) {
  const auth = window._firebase?.auth;
  const user = auth?.currentUser;
  if (!user) throw new Error("User not signed in.");

  const { userRef, vaultConfigured } = await window.getVaultMeta();

  if (vaultConfigured) {
    throw new Error("Vault already exists.");
  }

  const verifier = await window.encryptWithVaultKey(VAULT_TEST_STRING, vaultKey);

  await updateDoc(userRef, {
    vaultConfigured: true,
    vaultVerifierEncrypted: verifier.encrypted,
    vaultVerifierIv: verifier.iv,
    vaultVerifierSalt: verifier.salt,
    updatedAt: serverTimestamp()
  });

  window.setVaultKeyInSession(vaultKey);
};

window.verifyAndUnlockVault = async function verifyAndUnlockVault(vaultKey) {
  const meta = await window.getVaultMeta();

  if (!meta.vaultConfigured) {
    throw new Error("Vault is not configured yet.");
  }

  const decrypted = await window.decryptWithVaultKey(
    {
      encrypted: meta.vaultVerifierEncrypted,
      iv: meta.vaultVerifierIv,
      salt: meta.vaultVerifierSalt
    },
    vaultKey
  );

  if (decrypted !== VAULT_TEST_STRING) {
    throw new Error("Invalid Vault Key.");
  }

  window.setVaultKeyInSession(vaultKey);
  return true;
};

window.isVaultUnlocked = function isVaultUnlocked() {
  return !!window.getVaultKeyFromSession();
};

window.openVaultFlow = async function openVaultFlow() {
  const formsTableWrap = document.getElementById("formsTableWrap");
  const vaultPanel = document.getElementById("vaultPanel");
  const vaultPanelTitle = document.getElementById("vaultPanelTitle");
  const vaultKeyInput = document.getElementById("vaultKeyInput");
  const vaultKeyConfirm = document.getElementById("vaultKeyConfirm");
  const vaultConfirmWrap = document.getElementById("vaultConfirmWrap");
  const vaultActionBtn = document.getElementById("vaultActionBtn");
  const lockVaultBtn = document.getElementById("lockVaultBtn");
  const deleteVaultBtn = document.getElementById("deleteVaultBtn");
  const vaultStatus = document.getElementById("vaultStatus");

  if (!vaultPanel || !vaultActionBtn || !vaultStatus) return false;

  const meta = await window.getVaultMeta();

  if (vaultKeyInput) vaultKeyInput.value = "";
  if (vaultKeyConfirm) vaultKeyConfirm.value = "";

  // already unlocked
  if (window.isVaultUnlocked()) {
    vaultPanel.style.display = "block";
    vaultPanelTitle.textContent = "Logins Vault Unlocked";
    vaultConfirmWrap.style.display = "none";
    vaultActionBtn.style.display = "none";
    lockVaultBtn.style.display = "inline-block";
    if (deleteVaultBtn) deleteVaultBtn.style.display = "inline-block";
    vaultStatus.textContent = "Logins Vault is unlocked for this session.";
    if (formsTableWrap) formsTableWrap.style.display = "block";
    return true;
  }

  // locked
  vaultPanel.style.display = "block";
  lockVaultBtn.style.display = "none";
  vaultActionBtn.style.display = "inline-block";
  if (formsTableWrap) formsTableWrap.style.display = "none";
  vaultStatus.textContent = "";

  if (!meta.vaultConfigured) {
    vaultPanelTitle.textContent = "Create Logins Vault";
    vaultActionBtn.textContent = "Create Vault";
    vaultConfirmWrap.style.display = "block";
    if (deleteVaultBtn) deleteVaultBtn.style.display = "none";
  } else {
    vaultPanelTitle.textContent = "Unlock Logins Vault";
    vaultActionBtn.textContent = "Unlock Vault";
    vaultConfirmWrap.style.display = "none";
    if (deleteVaultBtn) deleteVaultBtn.style.display = "inline-block";
  }

  return false;
};

document.addEventListener("DOMContentLoaded", () => {
  const vaultActionBtn = document.getElementById("vaultActionBtn");
  const lockVaultBtn = document.getElementById("lockVaultBtn");
  const deleteVaultBtn = document.getElementById("deleteVaultBtn");
  const vaultKeyInput = document.getElementById("vaultKeyInput");
  const vaultKeyConfirm = document.getElementById("vaultKeyConfirm");
  const vaultStatus = document.getElementById("vaultStatus");
  const formsTableWrap = document.getElementById("formsTableWrap");

  if (vaultActionBtn) {
    vaultActionBtn.addEventListener("click", async () => {
      const rawKey = vaultKeyInput?.value || "";
      const confirmKey = vaultKeyConfirm?.value || "";

      if (!rawKey.trim()) {
        if (vaultStatus) vaultStatus.textContent = "Please enter a Vault Key.";
        return;
      }

      try {
        const meta = await window.getVaultMeta();

        if (!meta.vaultConfigured) {
          if (rawKey.length < 12) {
            if (vaultStatus) vaultStatus.textContent = "Vault Key must be at least 12 characters.";
            return;
          }

          if (rawKey !== confirmKey) {
            if (vaultStatus) vaultStatus.textContent = "Vault Key confirmation does not match.";
            return;
          }

          if (vaultStatus) vaultStatus.textContent = "Creating vault...";
          await window.createVaultVerifier(rawKey);
          if (vaultStatus) vaultStatus.textContent = "Vault created and unlocked.";
        } else {
          if (vaultStatus) vaultStatus.textContent = "Unlocking vault...";
          await window.verifyAndUnlockVault(rawKey);
          if (vaultStatus) vaultStatus.textContent = "Vault unlocked.";
        }

        if (vaultKeyInput) vaultKeyInput.value = "";
        if (vaultKeyConfirm) vaultKeyConfirm.value = "";

        if (formsTableWrap) formsTableWrap.style.display = "block";
        if (window.loadUserForms) {
          window.loadUserForms();
        }

        await window.openVaultFlow();
      } catch (err) {
        console.error("Vault action error:", err);
        if (vaultStatus) vaultStatus.textContent = err.message || "Vault action failed.";
      }
    });
  }

  if (lockVaultBtn) {
    lockVaultBtn.addEventListener("click", async () => {
      window.clearVaultSession();
      if (formsTableWrap) formsTableWrap.style.display = "none";
      if (vaultStatus) vaultStatus.textContent = "Vault locked.";
      await window.openVaultFlow();
    });
  }

  if (deleteVaultBtn) {
    deleteVaultBtn.addEventListener("click", async () => {
      const ok = confirm(
        "This will permanently delete your Logins Vault and ALL saved login passwords.\n\nAre you sure?"
      );

      if (!ok) return;

      try {
        const auth = window._firebase?.auth;
        const user = auth?.currentUser;
        if (!user) {
          throw new Error("User not signed in.");
        }

        const { userRef } = await window.getVaultMeta();

        // Delete all saved forms/passwords
        const formsRef = collection(db, "users", user.uid, "forms");
        const formsSnap = await getDocs(formsRef);

        for (const formDoc of formsSnap.docs) {
          await deleteDoc(doc(db, "users", user.uid, "forms", formDoc.id));
        }

        // Clear vault verifier
        await updateDoc(userRef, {
          vaultConfigured: false,
          vaultVerifierEncrypted: "",
          vaultVerifierIv: "",
          vaultVerifierSalt: "",
          updatedAt: serverTimestamp()
        });

        // Clear session key
        window.clearVaultSession();

        // Reset UI
        if (formsTableWrap) {
          formsTableWrap.innerHTML = "";
          formsTableWrap.style.display = "none";
        }

        if (vaultKeyInput) vaultKeyInput.value = "";
        if (vaultKeyConfirm) vaultKeyConfirm.value = "";

        if (vaultStatus) {
          vaultStatus.textContent =
            "Vault deleted. All saved login passwords were deleted too. You can create a new vault.";
        }

        await window.openVaultFlow();
      } catch (err) {
        console.error("Delete vault error:", err);
        alert("Could not delete vault.");
      }
    });
  }
});