(function () {
  const dashboardLink = document.getElementById("dashboardLink");
  const dashBoard = document.getElementById("dashBoard");

  const dashboardUploadBtn = document.getElementById("dashboardUploadBtn");
  const dashboardCreateListBtn = document.getElementById("dashboardCreateListBtn");
  const dashboardPointsValue = document.getElementById("dashboardPointsValue");
  const dashboardPlanBadge = document.getElementById("dashboardPlanBadge");

  function setActiveSidebarItem(linkEl) {
    document.querySelectorAll(".sidebar-nav-item").forEach(item => {
      item.classList.remove("active");
    });

    if (linkEl) {
      linkEl.classList.add("active");
    }
  }

  function hideAllPanelsForDashboard() {
    if (typeof window.hideWorkspacePanels === "function") {
      window.hideWorkspacePanels();
    }

    if (dashBoard) {
      dashBoard.style.display = "none";
    }
  }

  function syncDashboardBilling() {
    const pointsLabel = document.getElementById("pointsLabel");
    const planLabel = document.getElementById("planLabel");

    if (!pointsLabel && !planLabel) return;

    if (dashboardPointsValue && pointsLabel) {
      dashboardPointsValue.textContent = pointsLabel.textContent.trim() || "0";
    }

    if (dashboardPlanBadge && planLabel) {
      const planText = planLabel.textContent.trim();
      dashboardPlanBadge.textContent = planText
        ? `${planText.toUpperCase()} PLAN`
        : "FREE PLAN";
    }
  }

  function showDashboardPanel() {
    hideAllPanelsForDashboard();

    if (dashBoard) {
      dashBoard.style.display = "block";
    }

    setActiveSidebarItem(dashboardLink);
    syncDashboardBilling();
  }

  if (dashboardLink) {
    dashboardLink.addEventListener("click", function (e) {
      e.preventDefault();
      showDashboardPanel();
    });
  }

  if (dashboardUploadBtn) {
    dashboardUploadBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      hideAllPanelsForDashboard();

      const docUploadPanel = document.getElementById("docUploadPanel");
      if (docUploadPanel) {
        docUploadPanel.style.display = "block";
      }
    });
  }

  if (dashboardCreateListBtn) {
    dashboardCreateListBtn.addEventListener("click", function (e) {
      e.preventDefault();

      hideAllPanelsForDashboard();

      if (typeof window.resetListImagesForNewList === "function") {
        window.resetListImagesForNewList();
      }

      const formContainer = document.getElementById("formContainer");
      const previewContainer = document.getElementById("preview-container");
      const createListsLink = document.getElementById("createListsLink");

      if (formContainer) {
        formContainer.style.display = "block";
      }

      if (previewContainer) {
        previewContainer.style.display = "block";
      }

      if (typeof window.createItemInputs === "function") {
        window.createItemInputs(5, 1);
      }

      sessionStorage.removeItem("currentListId");

      const saveBtn = document.getElementById("saveCloudBtn");
      if (saveBtn) {
        saveBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM6 8V5h9v3H6z"></path>
          </svg>
        `;
        saveBtn.title = "Save to Cloud";
        saveBtn.setAttribute("aria-label", "Save to Cloud");
      }

      document.querySelectorAll(".sidebar-nav-item").forEach(item => {
        item.classList.remove("active");
      });

      if (createListsLink) {
        createListsLink.classList.add("active");
      }

      if (typeof window.updatePreview === "function") {
        window.updatePreview();
      }
    });
  }

  window.showDashboardPanel = showDashboardPanel;
  window.syncDashboardBilling = syncDashboardBilling;
})();