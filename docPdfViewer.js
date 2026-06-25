(function () {
  const myDocsLink = document.getElementById("myDocsLink");
  const documentList = document.getElementById("documentList");
  const formContainer = document.getElementById("formContainer");

  function hideAllPanels() {
    if (typeof window.hideWorkspacePanels === "function") {
      window.hideWorkspacePanels();
      return;
    }

    const formContainer = document.getElementById("formContainer");
    const previewContainer = document.getElementById("preview-container");
    const documentList = document.getElementById("documentList");
    const savedListsView = document.getElementById("savedListsView");
    const myAccountPanel = document.getElementById("myAccountPanel");
    const pdfViewerPanel = document.getElementById("pdfViewerPanel");
    const formsListPanel = document.getElementById("formsListPanel");
    const createLoginPanel = document.getElementById("createLoginPanel");
    const searchBox = document.getElementById("search-box");
    const docUploadPanel = document.getElementById("docUploadPanel");
    const shareDocPanel = document.getElementById("shareDocPanel");

    if (formContainer) formContainer.style.display = "none";
    if (previewContainer) previewContainer.style.display = "none";
    if (documentList) documentList.style.display = "none";
    if (savedListsView) savedListsView.style.display = "none";
    if (myAccountPanel) myAccountPanel.style.display = "none";
    if (pdfViewerPanel) pdfViewerPanel.style.display = "none";
    if (formsListPanel) formsListPanel.style.display = "none";
    if (createLoginPanel) createLoginPanel.style.display = "none";
    if (searchBox) searchBox.style.display = "none";
    if (docUploadPanel) docUploadPanel.style.display = "none";
    if (shareDocPanel) shareDocPanel.style.display = "none";
  }

  if (myDocsLink) {
    myDocsLink.addEventListener("click", async function (e) {
      e.preventDefault();

      hideAllPanels();

      if (documentList) documentList.style.display = "block";

      const allNavItems = document.querySelectorAll(".sidebar-nav-item");
      allNavItems.forEach(item => item.classList.remove("active"));
      myDocsLink.classList.add("active");

      if (window.loadUserDocuments) {
        await window.loadUserDocuments();
      }
    });
  }

  window.openPdf = function (url) {
    const panel = document.getElementById("pdfViewerPanel");
    const frame = document.getElementById("pdfFrame");
    const docList = document.getElementById("documentList");

    if (docList) docList.style.display = "none";

    if (!panel || !frame) {
      window.open(url, "_blank");
      return;
    }

    panel.style.display = "block";
    frame.src = url;

    if (formContainer) formContainer.style.display = "none";
  };

  window.closePdfViewer = function () {
    const panel = document.getElementById("pdfViewerPanel");
    const frame = document.getElementById("pdfFrame");
    const docList = document.getElementById("documentList");

    if (panel) panel.style.display = "none";
    if (frame) frame.src = "";

    if (docList) docList.style.display = "block";
    if (formContainer) formContainer.style.display = "none";
  };
})();

window.showToast = function showToast(message) {
  const toast = document.getElementById("toastMessage");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
};

const searchDocsLink = document.getElementById("searchDocsLink");
const searchBox = document.getElementById("search-box");

if (searchDocsLink && searchBox) {
  searchDocsLink.addEventListener("click", function (e) {
    e.preventDefault();
    const isOpen = searchBox.style.display === "block";
    searchBox.style.display = isOpen ? "none" : "block";
  });
}