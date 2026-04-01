import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const db = getFirestore();

window.saveLoginFormToFirestore = async function saveLoginFormToFirestore(data) {
  const auth = window._firebase?.auth;
  const user = auth?.currentUser;

  if (!user) {
    throw new Error("User is not signed in.");
  }

  const account = String(data.account || "").trim();
  const username = String(data.username || "").trim();
  const password = String(data.password || "");

  if (!account || !username || !password) {
    throw new Error("Missing required fields.");
  }

  await addDoc(collection(db, "users", user.uid, "forms"), {
    type: "login",
    account,
    username,
    password,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};