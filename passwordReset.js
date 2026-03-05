// passwordReset.js
const { auth } = window._firebase;
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const forgotLink = document.getElementById('forgotLink');
const resetBox   = document.getElementById('resetBox');
const resetEmail = document.getElementById('resetEmail');
const sendBtn    = document.getElementById('sendResetBtn');
const resetMsg   = document.getElementById('resetMsg');

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetBox.hidden = false;
    resetEmail?.focus();
  });
}

if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    const email = resetEmail.value.trim();
    if (!email) {
      resetMsg.textContent = 'Enter your email.';
      resetMsg.style.color = '#d33';
      return;
    }

    // Let users land on your custom reset page
    const actionCodeSettings = {
      url: `${window.location.origin}/reset.html`, // make sure this file exists on the same domain
      handleCodeInApp: true,
    };

    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      resetMsg.textContent = 'Reset link sent! Check your email.';
      resetMsg.style.color = '#0a7';
    } catch (err) {
      resetMsg.textContent = err.message || 'Failed to send reset email.';
      resetMsg.style.color = '#d33';
    }
  });
}
