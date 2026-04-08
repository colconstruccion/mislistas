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
  };

  if (!myAccountLink || !myAccountPanel) return;

  myAccountLink.addEventListener("click", function (e) {
    e.preventDefault();

    const wasOpen = myAccountPanel.style.display === "block";

    if (typeof window.hideWorkspacePanels === "function") {
      window.hideWorkspacePanels();
    }

    if (!wasOpen) {
      myAccountPanel.style.display = "block";
    }
  });
})();