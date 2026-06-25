// writeEmail.js

import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const functions = getFunctions();
const sendTextEmail = httpsCallable(functions, "sendTextEmail");

const writeEmailLink = document.getElementById("writeEmailLink");
const writeEmailForm = document.getElementById("writeEmailForm");

if (writeEmailLink) {
  writeEmailLink.addEventListener("click", (e) => {
    e.preventDefault();

    if (typeof window.openWriteEmailPanel === "function") {
      window.openWriteEmailPanel();
    }
  });
}

if (writeEmailForm) {
  writeEmailForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const to = document.getElementById("emailTo")?.value?.trim() || "";
    const cc = document.getElementById("emailCc")?.value?.trim() || "";
    const subject = document.getElementById("emailSubject")?.value?.trim() || "";
    const message = document.getElementById("emailMessage")?.value?.trim() || "";
    const statusEl = document.getElementById("writeEmailStatus");
    const sendBtn = document.getElementById("sendTextEmailBtn");

    if (!to || !subject || !message) {
      if (statusEl) {
        statusEl.textContent = "TO, subject, and message are required.";
        statusEl.style.color = "#a00";
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(to)) {
      if (statusEl) {
        statusEl.textContent = "Please enter a valid TO email address.";
        statusEl.style.color = "#a00";
      }
      return;
    }

    if (cc) {
      const ccEmails = cc
        .split(/[,;\n]+/)
        .map(email => email.trim())
        .filter(Boolean);

      const invalidCc = ccEmails.find(email => !emailRegex.test(email));

      if (invalidCc) {
        if (statusEl) {
          statusEl.textContent = `Invalid CC email: ${invalidCc}`;
          statusEl.style.color = "#a00";
        }
        return;
      }
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Sending...";
      }

      if (statusEl) {
        statusEl.textContent = "Sending email...";
        statusEl.style.color = "#333";
      }

      await sendTextEmail({
        to,
        cc,
        subject,
        message
      });

      if (statusEl) {
        statusEl.textContent = "Email sent successfully.";
        statusEl.style.color = "#0a0";
      }

      writeEmailForm.reset();

    } catch (error) {
      console.error("Error sending email:", error);

      if (statusEl) {
        statusEl.textContent =
          error?.message ||
          error?.details?.message ||
          "Error sending email.";

        statusEl.style.color = "#a00";
      }

    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Email";
      }
    }
  });
}