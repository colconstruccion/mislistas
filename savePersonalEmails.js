// savePersonalEmails.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {

  const saveBtn = document.getElementById("saveEmailListBtn");

  if (!saveBtn) return;

  saveBtn.addEventListener("click", savePersonalEmailList);

  const saveAllBtn = document.getElementById("saveCleanAndRolesBtn");

  if (saveAllBtn) {
  saveAllBtn.addEventListener(
    "click",
    savePersonalAndRoleEmailList
  );
}

});

async function savePersonalEmailList() {

  try {

    const user = auth.currentUser;

    if (!user) {
      alert("Please log in first.");
      return;
    }

    const listName =
      document.getElementById("emailListName")?.value?.trim();

    if (!listName) {
      alert("Please enter a list name.");
      return;
    }

    if (!window.cleanedEmailLists) {
      alert("Please click Clean Emails first.");
      return;
    }

    const {
      validEmails,
      roleEmails,
      invalidEmails,
      duplicateEmails
    } = window.cleanedEmailLists;

    if (!validEmails || validEmails.length === 0) {
      alert("No personal emails found to save.");
      return;
    }

    const emailListData = {

      name: listName,

      personalEmails: validEmails,

      roleEmails: [],

      stats: {
        personalCount: validEmails.length,
        roleCount: 0,
        invalidCount: invalidEmails?.length || 0,
        duplicateCount: duplicateEmails?.length || 0
      },

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()

    };

    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "emailLists"
      ),
      emailListData
    );

    alert(
      `Email list saved successfully.\n\n` +
      `Personal Emails: ${validEmails.length}` 
    );

  } catch (error) {

    console.error("Error saving email list:", error);

    alert(
      "Could not save email list.\n\n" +
      error.message
    );

  }
}

async function savePersonalAndRoleEmailList() {

  try {

    const user = auth.currentUser;

    if (!user) {
      alert("Please log in first.");
      return;
    }

    const listName =
      document.getElementById("emailListName")
      ?.value?.trim();

    if (!listName) {
      alert("Please enter a list name.");
      return;
    }

    if (!window.cleanedEmailLists) {
      alert("Please click Clean Emails first.");
      return;
    }

    const {
      validEmails,
      roleEmails,
      invalidEmails,
      duplicateEmails
    } = window.cleanedEmailLists;

    const emailListData = {

      name: listName,

      personalEmails: validEmails || [],

      roleEmails: roleEmails || [],

      stats: {
        personalCount:
          validEmails?.length || 0,

        roleCount:
          roleEmails?.length || 0,

        invalidCount:
          invalidEmails?.length || 0,

        duplicateCount:
          duplicateEmails?.length || 0
      },

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()

    };

    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "emailLists"
      ),
      emailListData
    );

    alert(
      `Email list saved.\n\n` +
      `Personal Emails: ${validEmails.length}\n` +
      `Generic Emails: ${roleEmails.length}`
    );

  } catch (error) {

    console.error(error);

    alert(
      "Could not save email list.\n\n" +
      error.message
    );
  }
}