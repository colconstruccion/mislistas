// searchBox.js
// Reusable search box logic for index.html and auth.html

(function () {
  function initSearchBox() {
    const searchBtn = document.getElementById("searchPublicDocBtn");
    const input = document.getElementById("publicIdInput");
    const msg = document.getElementById("searchResultMsg");

    // If this page does not have the search box, do nothing
    if (!searchBtn || !input || !msg) return;

    searchBtn.addEventListener("click", () => {
      const id = (input.value || "").trim().toUpperCase();

      if (!id) {
        msg.textContent = "Enter a document ID (e.g., B3KM).";
        msg.style.color = "#a00";
        return;
      }

      msg.style.color = "#333";
      msg.textContent = `Searching for "${id}"…`;

      // 🔌 Firestore lookup will be added in Step 3
      if (typeof window.searchPublicDocument === "function") {
        window.searchPublicDocument(id);
      } else {
        // Temporary placeholder
        msg.textContent = `Search ready for "${id}" (Firestore wiring next)`;
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchBox);
  } else {
    initSearchBox();
  }
})();
