// listaDateScript.js
// Turns the LAST column into date inputs when calendar toggle is active.
// Works only for 2-column and 3-column lists.

(function () {
  let dateColumnEnabled = false;

  function getCurrentColumnsFromDOM() {
    const firstRow = document.querySelector("#itemsContainer .inputs-row");
    if (!firstRow) return 1;

    const columnWrappers = firstRow.querySelectorAll(".column-input-wrapper");

    if (columnWrappers.length >= 2) {
      return columnWrappers.length;
    }

    return 1;
  }

  function isLastColumnInput(index, columns) {
    if (columns < 2) return false;
    return (index + 1) % columns === 0;
  }

  function syncDateColumnMode() {
    const columns = getCurrentColumnsFromDOM();
    const inputs = Array.from(document.querySelectorAll("#itemsContainer input[name='item']"));

    // If user goes back to 1 column, turn date mode off automatically
    if (columns < 2 && dateColumnEnabled) {
      dateColumnEnabled = false;

      const toggleCalendarBtn = document.getElementById("toggleCalendarBtn");
      if (toggleCalendarBtn) {
        toggleCalendarBtn.classList.remove("active");
      }
    }

    inputs.forEach((input, index) => {
      const shouldBeDate = dateColumnEnabled && isLastColumnInput(index, columns);

      if (shouldBeDate) {
        input.type = "date";
        input.classList.add("date-column-input");
        input.placeholder = "";
      } else {
        input.type = "text";
        input.classList.remove("date-column-input");
        input.placeholder = "Enter list item";
      }
    });

    if (typeof window.updatePreview === "function") {
      try {
        window.updatePreview();
      } catch (err) {
        console.warn("Could not update preview after date mode sync:", err);
      }
    }
  }

  function toggleDateColumnMode() {
    const columns = getCurrentColumnsFromDOM();

    if (columns < 2) {
      alert("Date column works only with 2-column or 3-column lists.");
      return;
    }

    dateColumnEnabled = !dateColumnEnabled;

    const toggleCalendarBtn = document.getElementById("toggleCalendarBtn");
    if (toggleCalendarBtn) {
      toggleCalendarBtn.classList.toggle("active", dateColumnEnabled);
    }

    syncDateColumnMode();
  }

  function wrapEditorFunction(functionName) {
    const originalFn = window[functionName];

    if (typeof originalFn !== "function") return;

    window[functionName] = function (...args) {
      const result = originalFn.apply(this, args);

      setTimeout(() => {
        syncDateColumnMode();
      }, 0);

      return result;
    };
  }

  function initDateColumnFeature() {
    const toggleCalendarBtn = document.getElementById("toggleCalendarBtn");

    if (!toggleCalendarBtn) {
      console.warn("Calendar button not found: #toggleCalendarBtn");
      return;
    }

    toggleCalendarBtn.addEventListener("click", toggleDateColumnMode);

    // Re-apply date mode whenever your main editor rebuilds inputs
    wrapEditorFunction("createItemInputs");
    wrapEditorFunction("addRow");
    wrapEditorFunction("deleteRow");
    wrapEditorFunction("addColumn");
    wrapEditorFunction("deleteColumn");

    syncDateColumnMode();
  }

  // Public functions for saveToFirestore.js and loadFromFirestore.js
  window.getDateColumnEnabled = function () {
    return dateColumnEnabled === true;
  };

  window.setDateColumnEnabled = function (value) {
    dateColumnEnabled = value === true;

    const toggleCalendarBtn = document.getElementById("toggleCalendarBtn");
    if (toggleCalendarBtn) {
      toggleCalendarBtn.classList.toggle("active", dateColumnEnabled);
    }

    syncDateColumnMode();
  };

  window.syncDateColumnMode = syncDateColumnMode;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDateColumnFeature);
  } else {
    initDateColumnFeature();
  }
})();