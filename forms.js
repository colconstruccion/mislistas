document.addEventListener("DOMContentLoaded", () => {
  const toggleFormsBtn = document.getElementById("toggleFormsBtn");
  const formsSubmenu = document.getElementById("formsSubmenu");

  const openCreateLoginLink = document.getElementById("openCreateLoginLink");
  const createLoginPanel = document.getElementById("createLoginPanel");

  const myFormsLink = document.getElementById("myFormsLink");
  const formsListPanel = document.getElementById("formsListPanel");

  const formContainer = document.getElementById("formContainer");
  const documentList = document.getElementById("documentList");
  const savedListsView = document.getElementById("savedListsView");
  const pdfViewerPanel = document.getElementById("pdfViewerPanel");
  const myAccountPanel = document.getElementById("myAccountPanel");
  const searchBox = document.getElementById("search-box");
  const previewContainer = document.getElementById("preview-container");

  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const copyPasswordBtn = document.getElementById("copyPasswordBtn");
  const loginPassword = document.getElementById("loginPassword");

  const loginFormPanel = document.getElementById("loginFormPanel");
  const loginAccount = document.getElementById("loginAccount");
  const loginUsername = document.getElementById("loginUsername");
  const loginFormStatus = document.getElementById("loginFormStatus");

  // Toggle Create Forms submenu
  if (toggleFormsBtn && formsSubmenu) {
    toggleFormsBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const isOpen = formsSubmenu.style.display === "block";
      formsSubmenu.style.display = isOpen ? "none" : "block";
    });
  }

  // Open / close Create Login panel
  if (openCreateLoginLink && createLoginPanel) {
    openCreateLoginLink.addEventListener("click", (e) => {
      e.preventDefault();

      const isOpen = createLoginPanel.style.display === "block";

      if (formContainer) formContainer.style.display = "none";
      if (documentList) documentList.style.display = "none";
      if (savedListsView) savedListsView.style.display = "none";
      if (pdfViewerPanel) pdfViewerPanel.style.display = "none";
      if (myAccountPanel) myAccountPanel.style.display = "none";
      if (searchBox) searchBox.style.display = "none";
      if (previewContainer) previewContainer.style.display = "none";
      if (formsListPanel) formsListPanel.style.display = "none";

      createLoginPanel.style.display = isOpen ? "none" : "block";

      if (isOpen && formContainer) {
        formContainer.style.display = "block";
        if (previewContainer) previewContainer.style.display = "block";
      }
    });
  }

  // Open My Forms panel
  if (myFormsLink && formsListPanel) {
    myFormsLink.addEventListener("click", (e) => {
      e.preventDefault();

      const isOpen = formsListPanel.style.display === "block";

      // If already open → close it
      if (isOpen) {
        formsListPanel.style.display = "none";

        // Optional: return to main view
        if (formContainer) formContainer.style.display = "block";
        if (previewContainer) previewContainer.style.display = "block";

        return;
      }

      // Otherwise → open it
      if (formContainer) formContainer.style.display = "none";
      if (documentList) documentList.style.display = "none";
      if (savedListsView) savedListsView.style.display = "none";
      if (pdfViewerPanel) pdfViewerPanel.style.display = "none";
      if (myAccountPanel) myAccountPanel.style.display = "none";
      if (searchBox) searchBox.style.display = "none";
      if (previewContainer) previewContainer.style.display = "none";
      if (createLoginPanel) createLoginPanel.style.display = "none";

      formsListPanel.style.display = "block";

      if (window.loadUserForms) {
        window.loadUserForms();
      }
    });
  }
  
  // Show / hide password
  if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener("click", () => {
      const isHidden = loginPassword.type === "password";
      loginPassword.type = isHidden ? "text" : "password";

      const icon = togglePasswordBtn.querySelector(".material-icons");
      if (icon) {
        icon.textContent = isHidden ? "visibility_off" : "visibility";
      }
    });
  }

  // Copy password
  if (copyPasswordBtn && loginPassword) {
    copyPasswordBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(loginPassword.value || "");

        if (window.showToast) {
          window.showToast("Password copied");
        } else {
          alert("Password copied");
        }
      } catch (err) {
        alert("Could not copy password");
      }
    });
  }

  // Save login form
  if (loginFormPanel) {
    loginFormPanel.addEventListener("submit", async (e) => {
      e.preventDefault();

      const account = loginAccount?.value.trim() || "";
      const username = loginUsername?.value.trim() || "";
      const password = loginPassword?.value || "";

      if (!account) {
        if (loginFormStatus) loginFormStatus.textContent = "Please enter Login Account.";
        return;
      }

      if (!username) {
        if (loginFormStatus) loginFormStatus.textContent = "Please enter Username.";
        return;
      }

      if (!password) {
        if (loginFormStatus) loginFormStatus.textContent = "Please enter Password.";
        return;
      }

      if (loginFormStatus) loginFormStatus.textContent = "Saving...";

      try {
        await window.saveLoginFormToFirestore({
          account,
          username,
          password
        });

        if (loginFormStatus) loginFormStatus.textContent = "Login form saved.";

        loginAccount.value = "";
        loginUsername.value = "";
        loginPassword.value = "";
      } catch (err) {
        console.error("Save login form error:", err);
        if (loginFormStatus) loginFormStatus.textContent = "Could not save login form.";
      }
    });
  }
});