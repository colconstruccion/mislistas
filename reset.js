// reset.js
const { auth } = window._firebase;
import {
  verifyPasswordResetCode,
  confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const statusEl = document.getElementById('status');
const emailEl  = document.getElementById('resetEmail');
const form     = document.getElementById('resetForm');
const pass1El  = document.getElementById('newPassword');
const pass2El  = document.getElementById('confirmPassword');

const params  = new URLSearchParams(window.location.search);
const mode    = params.get('mode');
const oobCode = params.get('oobCode');

(async () => {
  // Basic guard
  if (mode !== 'resetPassword' || !oobCode) {
    statusEl.textContent = 'Invalid reset link.';
    statusEl.style.color = '#d33';
    form.style.display = 'none';
    return;
  }

  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    emailEl.textContent = email;
    statusEl.textContent = 'Enter a new password.';
    statusEl.style.color = '#333';
  } catch (err) {
    statusEl.textContent = 'This reset link is invalid or has expired.';
    statusEl.style.color = '#d33';
    form.style.display = 'none';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = pass1El.value;
    const p2 = pass2El.value;

    if (p1 !== p2) {
      statusEl.textContent = 'Passwords do not match.';
      statusEl.style.color = '#d33';
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, p1);
      statusEl.textContent = 'Password updated! You can now log in.';
      statusEl.style.color = '#0a7';
      setTimeout(() => (window.location.href = 'login.html'), 1200);
    } catch (err) {
      statusEl.textContent = err.message || 'Failed to update password.';
      statusEl.style.color = '#d33';
    }
  });
})();
