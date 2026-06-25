document.addEventListener("DOMContentLoaded", () => {
  const cleanEmailsBtn = document.getElementById("cleanEmailsBtn");
  const rawInput = document.getElementById("emailListRawInput");

  const validEmailsBox = document.getElementById("validEmails");
  const roleEmailsBox = document.getElementById("roleEmails");
  const invalidEmailsBox = document.getElementById("invalidEmails");
  const duplicateEmailsBox = document.getElementById("duplicateEmails");

  const validCount = document.getElementById("validCount");
  const roleCount = document.getElementById("roleCount");
  const invalidCount = document.getElementById("invalidCount");
  const duplicateCount = document.getElementById("duplicateCount");

  const resultBox = document.getElementById("emailValidationResult");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rolePrefixes = [
    "info",
    "contact",
    "sales",
    "support",
    "admin",
    "office",
    "billing",
    "accounts",
    "marketing",
    "service",
    "help",
    "hello",
    "team",
    "hr",
    "jobs",
    "career",
    "careers",
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
    "webmaster",
    "mail",
    "newsletter",
    "customerservice"
  ];

  function splitRawEmails(rawText) {
    return rawText
      .split(/[\s,;]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
  }

  function isRoleEmail(email) {
    const localPart = email.split("@")[0];

    return rolePrefixes.some(prefix =>
      localPart === prefix ||
      localPart.startsWith(prefix + ".") ||
      localPart.startsWith(prefix + "-") ||
      localPart.startsWith(prefix + "_")
    );
  }

  function displayList(element, emails) {
    if (!element) return;
    element.textContent = emails.length ? emails.join("\n") : "No emails found.";
  }

  function cleanEmails() {
    if (!rawInput) return;

    const rawEmails = splitRawEmails(rawInput.value || "");

    const seenEmails = new Set();

    const validEmails = [];
    const roleEmails = [];
    const invalidEmails = [];
    const duplicateEmails = [];

    rawEmails.forEach(email => {
      if (seenEmails.has(email)) {
        duplicateEmails.push(email);
        return;
      }

      seenEmails.add(email);

      if (!emailRegex.test(email)) {
        invalidEmails.push(email);
        return;
      }

      if (isRoleEmail(email)) {
        roleEmails.push(email);
      } else {
        validEmails.push(email);
      }
    });

    displayList(validEmailsBox, validEmails);
    displayList(roleEmailsBox, roleEmails);
    displayList(invalidEmailsBox, invalidEmails);
    displayList(duplicateEmailsBox, duplicateEmails);

    if (validCount) validCount.textContent = validEmails.length;
    if (roleCount) roleCount.textContent = roleEmails.length;
    if (invalidCount) invalidCount.textContent = invalidEmails.length;
    if (duplicateCount) duplicateCount.textContent = duplicateEmails.length;

    if (resultBox) {
      resultBox.innerHTML = `
        <strong>Cleaning complete.</strong><br>
        Valid emails: ${validEmails.length}<br>
        Role-based emails: ${roleEmails.length}<br>
        Invalid emails: ${invalidEmails.length}<br>
        Duplicate emails: ${duplicateEmails.length}<br>
        Total pasted entries: ${rawEmails.length}
      `;
    }

    window.cleanedEmailLists = {
      validEmails,
      roleEmails,
      invalidEmails,
      duplicateEmails,
      allValidEmails: [...validEmails, ...roleEmails]
    };

    const savePersonalBtn =
      document.getElementById("saveEmailListBtn");

    const saveAllBtn =
      document.getElementById("saveCleanAndRolesBtn");

    if (savePersonalBtn) {
      savePersonalBtn.disabled =
        validEmails.length === 0;
    }

    if (saveAllBtn) {
      saveAllBtn.disabled =
        (validEmails.length + roleEmails.length) === 0;
    }
  }

    if (cleanEmailsBtn) {
        cleanEmailsBtn.addEventListener("click", cleanEmails);
      }

});