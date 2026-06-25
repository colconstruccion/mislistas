(function () {
  const myAccountLink = document.getElementById("myAccountLink");
  const myAccountPanel = document.getElementById("myAccountPanel");

  const dashBoard = document.getElementById("dashBoard");
  const formContainer = document.getElementById("formContainer");
  const previewContainer = document.getElementById("preview-container");
  const documentList = document.getElementById("documentList");
  const savedListsView = document.getElementById("savedListsView");
  const pdfViewerPanel = document.getElementById("pdfViewerPanel");
  const formsListPanel = document.getElementById("formsListPanel");
  const createLoginPanel = document.getElementById("createLoginPanel");
  const docUploadPanel = document.getElementById("docUploadPanel");
  const shareDocPanel = document.getElementById("shareDocPanel");
  const vaultPanel = document.getElementById("vaultPanel");
  const inboxPanel = document.getElementById("inboxPanel");
  const shareListEmailPanel = document.getElementById("shareListEmailPanel");

  window.hideWorkspacePanels = function hideWorkspacePanels() {
    if (dashBoard) dashBoard.style.display = "none";
    if (formContainer) formContainer.style.display = "none";
    if (previewContainer) previewContainer.style.display = "none";
    if (documentList) documentList.style.display = "none";
    if (savedListsView) savedListsView.style.display = "none";
    if (pdfViewerPanel) pdfViewerPanel.style.display = "none";
    if (formsListPanel) formsListPanel.style.display = "none";
    if (createLoginPanel) createLoginPanel.style.display = "none";
    if (docUploadPanel) docUploadPanel.style.display = "none";
    if (shareDocPanel) shareDocPanel.style.display = "none";
    if (myAccountPanel) myAccountPanel.style.display = "none";
    if (vaultPanel) vaultPanel.style.display = "none";
    if (inboxPanel) inboxPanel.style.display = "none";
    if (shareListEmailPanel) shareListEmailPanel.style.display = "none";
  };

  if (!myAccountLink || !myAccountPanel) return;

  window.openMyAccountPanel = function () {

    if (typeof window.hideWorkspacePanels === "function") {
      window.hideWorkspacePanels();
    }

    if (myAccountPanel) {
      myAccountPanel.style.display = "block";
    }

    const allNavItems = document.querySelectorAll(".sidebar-nav-item");
    allNavItems.forEach(item => item.classList.remove("active"));

    if (myAccountLink) {
      myAccountLink.classList.add("active");
    }
  };

  myAccountLink.addEventListener("click", function (e) {
    e.preventDefault();
    window.openMyAccountPanel();
  });

  const myInboxLink = document.getElementById("myInboxLink");

  if (myInboxLink && inboxPanel) {
    myInboxLink.addEventListener("click", function (e) {
      e.preventDefault();

      const wasOpen = inboxPanel.style.display === "block";

      if (typeof window.hideWorkspacePanels === "function") {
        window.hideWorkspacePanels();
      }

      if (!wasOpen) {
        inboxPanel.style.display = "block";
      }
    });
  }

})();