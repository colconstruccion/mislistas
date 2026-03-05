/* showSavedLists.js */
/* Render Saved Lists into #savedListsView with simple pagination */

(function () {
  const PAGE_SIZE = 10;
  let savedListsPage = 0;

  // Global cache (filled by loadSavedLists in loadFromFirestore.js)
  window.allUserLists = window.allUserLists || [];

  function getSavedContainer() {
    return document.getElementById('savedListsView');
  }

  function getListsForPage(allLists, page) {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return allLists.slice(start, end);
  }

  function showSavedLists() {
    const container = getSavedContainer();
    if (!container) {
      console.error("savedListsView not found. Add <div id='savedListsView'></div> before #formContainer.");
      return;
    }

    // Make sure the view is visible (we do NOT hide the editor)
    container.style.display = 'block';

    const allLists = window.allUserLists || [];
    const totalLists = allLists.length;
    const totalPages = totalLists === 0 ? 1 : Math.ceil(totalLists / PAGE_SIZE);

    if (savedListsPage < 0) savedListsPage = 0;
    if (savedListsPage > totalPages - 1) savedListsPage = totalPages - 1;

    const pageLists = getListsForPage(allLists, savedListsPage);

    let html = `
      <h2 style="margin:0 0 8px 0;">My Saved Lists</h2>
      <div class="saved-lists-wrapper" style="display:flex; flex-direction:column; gap:12px;">
    `;

    if (pageLists.length === 0) {
      html += `<p style="color:#666; font-size:14px;">No saved lists to show.</p>`;
    } else {
      pageLists.forEach((listObj) => {
        const title = listObj.title || "(untitled list)";
        const note = listObj.note || "";
        const items = Array.isArray(listObj.items) ? listObj.items : [];

        html += `
          <div class="saved-list-card"
              style="border:1px solid #ccc; border-radius:8px; padding:12px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <div style="font-weight:bold; font-size:16px; color:#333;">${title}</div>
                <div style="font-size:12px; color:#777;">
                  ${typeof listObj.count === 'number' ? `${listObj.count} item(s)` : `${(items||[]).length} item(s)`}
                  ${listObj.createdAt ? ` · ${listObj.createdAt}` : ""}
                  ${listObj.id ? ` · ID: ${listObj.id}` : ""}
                </div>
              </div>

              <button type="button"
                title="Delete this list"
                aria-label="Delete this list"
                onclick="deleteListById('${listObj.id}')"
                style="
                  width:30px;
                  height:30px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:transparent;
                  border:none;
                  border-radius:50%;
                  color:#a33;
                  cursor:pointer;
                  transition:all 0.2s ease;">
                <svg xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    width='16'
                    height='16'
                    style='min-width:16px; min-height:16px;'>
                  <path d='M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9ZM7 6H17V19H7V6Z'/>
                </svg>
              </button>
              
            </div>

            <ul style="margin-top:8px; padding-left:20px; font-size:14px; color:#444;">
              ${items.slice(0,5).map(it => `<li>${it || ""}</li>`).join("")}
              ${items.length > 5 ? `<li>… (${items.length} items total)</li>` : ""}
            </ul>

            ${note
              ? `<div style="margin-top:8px; font-size:13px; color:#666;"><strong>Note:</strong> ${note}</div>`
              : ""}

            <button type="button"
              style="margin-top:10px; font-size:13px; padding:6px 10px; border-radius:6px; border:1px solid #333; background:#f0f0f0; color:#222; font-weight:600; cursor:pointer;"
              onclick="openListById('${listObj.id}')">
              Open in editor
            </button>
          </div>
        `;

      });
    }

    html += `</div>`; // wrapper end

    const prevDisabled = savedListsPage === 0;
    const nextDisabled = savedListsPage >= totalPages - 1;

    html += `
      <div class="pagination"
           style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
        <button type="button"
          ${prevDisabled ? 'disabled' : ''}
          style="padding:6px 10px; border-radius:6px; border:1px solid ${prevDisabled ? '#aaa' : '#333'}; background:${prevDisabled ? '#eee' : '#fafafa'}; cursor:${prevDisabled ? 'not-allowed' : 'pointer'};"
          onclick="prevSavedPage()">
          ⟨ Prev
        </button>

        <div style="font-size:13px; color:#444;">
          Page ${savedListsPage + 1} of ${totalPages}
        </div>

        <button type="button"
          ${nextDisabled ? 'disabled' : ''}
          style="padding:6px 10px; border-radius:6px; border:1px solid ${nextDisabled ? '#aaa' : '#333'}; background:${nextDisabled ? '#eee' : '#fafafa'}; cursor:${nextDisabled ? 'not-allowed' : 'pointer'};"
          onclick="nextSavedPage(${totalPages})">
          Next ⟩
        </button>
      </div>
    `;

    container.innerHTML = html;
  }

  function prevSavedPage() {
    if (savedListsPage > 0) {
      savedListsPage--;
      showSavedLists();
    }
  }

  function nextSavedPage(totalPages) {
    if (savedListsPage < totalPages - 1) {
      savedListsPage++;
      showSavedLists();
    }
  }

  // Ensure data exists before showing; fetch if empty, then render.
  function ensureSavedLists() {
    const hasData = Array.isArray(window.allUserLists) && window.allUserLists.length > 0;

    const container = getSavedContainer();
    if (container) container.style.display = 'block'; // just show the panel

    if (hasData) {
      showSavedLists();
      return;
    }

    // If we don't have data yet, fetch from Firestore first.
    if (typeof window.loadSavedLists === "function") {
      // This will fill window.allUserLists; when finished you can click "My Saved Lists" again
      window.loadSavedLists("workspace");
    } else {
      showSavedLists();
    }
  }

  // Expose to global (onclick="")
  window.showSavedLists     = showSavedLists;
  window.prevSavedPage      = prevSavedPage;
  window.nextSavedPage      = nextSavedPage;
  window.ensureSavedLists   = ensureSavedLists;

  // If you’ve defined openListById in loadFromFirestore.js, it will be used by the button.
  // Otherwise, the button will fall back to any global loadListIntoEditor(id) you might have.
})();

