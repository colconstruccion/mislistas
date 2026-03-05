  // Reuse initialized Firebase from firebaseConfig.js
  const { auth, db } = window._firebase;

 import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


  import {
    doc, setDoc, serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

  const form = document.getElementById('signupForm');
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  const confirmEl = document.getElementById('confirm-password');

  // Optional: small message area
  let msg = document.querySelector('.form-message');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'form-message';
    msg.style.marginTop = '0.75rem';
    msg.style.fontSize = '0.9rem';
    msg.style.color = '#d33';
    form.after(msg);
  }
  const showMessage = (t, ok=false) => {
    msg.textContent = t;
    msg.style.color = ok ? '#0a7' : '#d33';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();
    const password = passEl.value;
    const confirm = confirmEl.value;

    if (password !== confirm) {
      showMessage('Passwords do not match.');
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Send verification email
      await sendEmailVerification(cred.user, {
        url: 'https://lysty.co/login.html'
      });


      // Force logout until verified
      await signOut(auth);

      showMessage(
        'Account created! Check your email to verify before logging in.',
        true
      );

      // Optional: redirect to login after a short pause
      setTimeout(() => {
        window.location.href = 'login.html?msg=verify';
      }, 5000);

    } catch (err) {
      // Common errors: email-already-in-use, weak-password, invalid-email
      showMessage(err.message || 'Sign up failed.');
    }
  });

