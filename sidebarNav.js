(function () {
  const dashboardLink = document.getElementById("dashboardLink");
  const createListsLink = document.getElementById("createListsLink");
  const myFormsLink = document.getElementById("myFormsLink");

  const allNavItems = document.querySelectorAll(".sidebar-nav-item");

  function setActive(linkEl) {
    allNavItems.forEach(item => item.classList.remove("active"));
    if (linkEl) linkEl.classList.add("active");
  }

  function hideAllPanels() {
    if (typeof window.hideWorkspacePanels === "function") {
      window.hideWorkspacePanels();
      return;
    }
  }

  if (dashboardLink) {
    dashboardLink.addEventListener("click", function (e) {
      e.preventDefault();

      hideAllPanels();
      setActive(dashboardLink);

      const dashBoard = document.getElementById("dashBoard");
      if (dashBoard) {
        dashBoard.style.display = "block";
      }

      if (typeof window.syncDashboardBilling === "function") {
        window.syncDashboardBilling();
      }
    });
  }

  if (createListsLink) {
    createListsLink.addEventListener("click", async function (e) {
      e.preventDefault();

      hideAllPanels();
      setActive(createListsLink);

      if (typeof window.ensureSavedLists === "function") {
        await window.ensureSavedLists();
      }
    });
  }

  if (myFormsLink) {
    myFormsLink.addEventListener("click", function (e) {
      e.preventDefault();

      hideAllPanels();
      setActive(myFormsLink);

      const formsListPanel = document.getElementById("formsListPanel");
      const vaultPanel = document.getElementById("vaultPanel");
      const openCreateLoginBtn = document.getElementById("openCreateLoginBtn");

      if (formsListPanel) {
        formsListPanel.style.display = "block";
      }

      if (vaultPanel) {
        vaultPanel.style.display = "none";
      }

      if (openCreateLoginBtn) {
        openCreateLoginBtn.style.display = "none";
      }
    });
  }

  const openVaultBtn = document.getElementById("openVaultBtn");

  if (openVaultBtn) {
    openVaultBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      const vaultPanel = document.getElementById("vaultPanel");
      const openCreateLoginBtn = document.getElementById("openCreateLoginBtn");

      if (vaultPanel) {
        vaultPanel.style.display = "block";
      }

      if (openCreateLoginBtn) {
        openCreateLoginBtn.style.display = "inline-block";
      }

      if (typeof window.openVaultFlow === "function") {
        await window.openVaultFlow();
      }
    });
  }

  const openCreateLoginBtn = document.getElementById("openCreateLoginBtn");

  if (openCreateLoginBtn) {
      openCreateLoginBtn.addEventListener("click", function (e) {
        e.preventDefault();

        hideAllPanels();

        const createLoginPanel = document.getElementById("createLoginPanel");
        if (createLoginPanel) {
          createLoginPanel.style.display = "block";
        }

        setActive(myFormsLink);
      });
    }
  })();