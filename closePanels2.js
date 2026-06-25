// closePanels2.js
document.addEventListener("DOMContentLoaded", () => {
  const createEmailListLink = document.getElementById("createEmailListLink");
  const myInboxLink = document.getElementById("myInboxLink");

  const emailPanel = document.getElementById("emailPanel");
  const inboxPanel = document.getElementById("inboxPanel");

  const savedEmailListsLink =
  document.getElementById("savedEmailListsLink");

  const savedEmailListsPanel =
  document.getElementById("savedEmailListsPanel");

  const openSavedListPanel =
  document.getElementById("openSavedListPanel");

  const writeEmailLink =
  document.getElementById("writeEmailLink");

  const writeEmailPanel =
  document.getElementById("writeEmailPanel");

  function clearEmailActiveLinks() {
    document.querySelectorAll(".sidebar-nav-item").forEach(link => {
      link.classList.remove("active");
    });
  }

  window.openEmailPanel = function () {
    if (emailPanel) emailPanel.style.display = "block";
    if (inboxPanel) inboxPanel.style.display = "none";
    if (savedEmailListsPanel) savedEmailListsPanel.style.display = "none";
    if (openSavedListPanel) openSavedListPanel.style.display = "none";
    if (writeEmailPanel) writeEmailPanel.style.display = "none";

    clearEmailActiveLinks();
    if (createEmailListLink) createEmailListLink.classList.add("active");
  };

  window.openInboxPanel = function () {
    if (emailPanel) emailPanel.style.display = "none";
    if (inboxPanel) inboxPanel.style.display = "block";
    if (savedEmailListsPanel) savedEmailListsPanel.style.display = "none";
    if (openSavedListPanel) openSavedListPanel.style.display = "none";
    if (writeEmailPanel) writeEmailPanel.style.display = "none";

    clearEmailActiveLinks();
    if (myInboxLink) myInboxLink.classList.add("active");
  };

  window.openSavedEmailListsPanel = function () {
    if (emailPanel) emailPanel.style.display = "none";
    if (inboxPanel) inboxPanel.style.display = "none";
    if (savedEmailListsPanel) savedEmailListsPanel.style.display = "block";
    if (openSavedListPanel) openSavedListPanel.style.display = "none";
    if (writeEmailPanel) writeEmailPanel.style.display = "none";

    clearEmailActiveLinks();

    if (savedEmailListsLink) {
      savedEmailListsLink.classList.add("active");
    }
  };

  window.openSavedListPanel = function () {
    if (emailPanel) emailPanel.style.display = "none";
    if (inboxPanel) inboxPanel.style.display = "none";
    if (savedEmailListsPanel) savedEmailListsPanel.style.display = "none";
    if (openSavedListPanel) openSavedListPanel.style.display = "block";
    if (writeEmailPanel) writeEmailPanel.style.display = "none";

    clearEmailActiveLinks();

    if (savedEmailListsLink) {
      savedEmailListsLink.classList.add("active");
    }
  };

  if (createEmailListLink) {
    createEmailListLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.openEmailPanel();
    });
  }

  if (myInboxLink) {
    myInboxLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.openInboxPanel();
    });
  }

  window.openWriteEmailPanel = function () {
  if (emailPanel) emailPanel.style.display = "none";
  if (inboxPanel) inboxPanel.style.display = "none";
  if (savedEmailListsPanel) savedEmailListsPanel.style.display = "none";
  if (openSavedListPanel) openSavedListPanel.style.display = "none";
  if (writeEmailPanel) writeEmailPanel.style.display = "block";

  clearEmailActiveLinks();

  if (writeEmailLink) {
      writeEmailLink.classList.add("active");
    }
  };

  if (writeEmailLink) {
    writeEmailLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.openWriteEmailPanel();
    });
  }

});