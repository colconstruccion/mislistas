// accordion.js
// Handles Create Lists sidebar accordion + reveals form & preview

(function () {

  function initAccordion() {
    const createListsLink = document.getElementById("createListsLink");
    const createListsMenu = document.getElementById("createListsMenu");

    if (!createListsLink || !createListsMenu) return;

    // Toggle Create Lists main section
    createListsLink.addEventListener("click", () => {
      const isOpen = createListsMenu.style.display === "block";
      createListsMenu.style.display = isOpen ? "none" : "block";

      // If collapsing, also collapse all nested lists
      if (isOpen) {
        createListsMenu
          .querySelectorAll("ul.nested")
          .forEach(ul => ul.style.display = "none");
      }
    });

    // Toggle each category (one / two / three column)
    createListsMenu
      .querySelectorAll(".toggle-link.sub")
      .forEach(link => {
        link.addEventListener("click", () => {
          const targetId = link.getAttribute("data-target");
          const ul = document.getElementById(targetId);
          if (!ul) return;

          const isOpen = ul.style.display === "block";

          // Close other categories
          createListsMenu
            .querySelectorAll("ul.nested")
            .forEach(other => {
              if (other !== ul) other.style.display = "none";
            });

          ul.style.display = isOpen ? "none" : "block";
        });
      });
  }

  function showCreateListUI() {
    const form = document.getElementById("formContainer");
    const preview = document.getElementById("preview-container");

    if (form) form.style.display = "block";
    if (preview) preview.style.display = "block";
  }

  // Listen for clicks on actual list options
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.option, a.option-3col");
    if (!link) return;

    e.preventDefault();
    showCreateListUI();
  }, true);

  // Init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccordion);
  } else {
    initAccordion();
  }

})();
