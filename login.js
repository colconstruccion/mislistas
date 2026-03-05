// login.js
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


function init() {
  const { auth } = window._firebase || {};
  if (!auth) return;

  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // <- stops the default GET/POST submit
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user); // safe, rate-limited
        await signOut(auth);

        alert(
          "Your email is not verified yet.\n\n" +
          "We just sent you a verification email. Please check your inbox (and spam)."
        );
        return;
      }

      window.location.href = 'auth.html';

    } catch (err) {
      alert(err.message || 'Login failed. Please try again.');
    }
  });

  const notice = document.getElementById('loginNotice');
  const params = new URLSearchParams(window.location.search);

  if (notice && params.get('msg') === 'verify') {
    notice.style.display = 'block';
    notice.textContent = 'Account created! Please verify your email (check spam) before logging in.';
  }

  history.replaceState({}, document.title, window.location.pathname);

}

// If config already ran, init immediately; otherwise wait for the signal.
if (window._firebase) {
  init();
} else {
  window.addEventListener('firebase-ready', init, { once: true });
}
