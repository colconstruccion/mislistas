document.addEventListener("DOMContentLoaded", () => {
  const toggleFormsBtn = document.getElementById("toggleFormsBtn");
  const formsSubmenu = document.getElementById("formsSubmenu");

  const openCreateLoginLink = document.getElementById("openCreateLoginLink");
  const createLoginPanel = document.getElementById("createLoginPanel");

  const openCreateLoginBtn = document.getElementById("openCreateLoginBtn");
  const businessCardPanel = document.getElementById("businessCardPanel");

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

  // for forms.html
  const openVaultBtn = document.getElementById("openVaultBtn");
  const openCreateBusinessCardBtn = document.getElementById("openCreateBusinessCardBtn");
  const viewSignupList = document.getElementById("viewSignupList");
  const vaultPanel = document.getElementById("vaultPanel");
  const signupResponsesPanel = document.getElementById("signupResponsesPanel");

  function hideFormsPanels(panelIdToShow = null) {
    const panelIds = [
      "vaultPanel",
      "createLoginPanel",
      "businessCardPanel",
      "signupResponsesPanel"
    ];

    panelIds.forEach((id) => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = "none";
    });

    if (panelIdToShow) {
      const panel = document.getElementById(panelIdToShow);
      if (panel) panel.style.display = "block";
    }
  }

  // Toggle Create Forms submenu
  if (toggleFormsBtn && formsSubmenu) {
    toggleFormsBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const isOpen = formsSubmenu.style.display === "block";
      formsSubmenu.style.display = isOpen ? "none" : "block";
    });
  }

  // For forms.html
  if (openVaultBtn) {
    openVaultBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      hideFormsPanels("vaultPanel");

      if (openCreateLoginBtn) {
        openCreateLoginBtn.style.display = "inline-block";
      }

      if (typeof window.openVaultFlow === "function") {
        await window.openVaultFlow();
      }
    });
  }

  if (openCreateLoginBtn) {
    openCreateLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hideFormsPanels("createLoginPanel");
    });
  }

  if (openCreateBusinessCardBtn) {
    openCreateBusinessCardBtn.addEventListener("click", (e) => {
      e.preventDefault();

      hideFormsPanels("businessCardPanel");

      if (openCreateLoginBtn) {
        openCreateLoginBtn.style.display = "none";
      }
    });
  }

  if (viewSignupList) {
    viewSignupList.addEventListener("click", (e) => {
      e.preventDefault();

      hideFormsPanels("signupResponsesPanel");

      if (openCreateLoginBtn) {
        openCreateLoginBtn.style.display = "none";
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