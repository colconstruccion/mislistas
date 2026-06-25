let sessionId = sessionStorage.getItem("sessionId") || crypto.randomUUID();
sessionStorage.setItem("sessionId", sessionId);

let currentColumns = 1;
let checkboxesEnabled = false; // default hidden
let linksEnabled = false;

let signupEnabled = false;
let signupVisibility = "private";
let signupFields = ["Name", "Email", "Phone"];

function getInputLink(input) {
  return input?.dataset?.link || "";
}

function setInputLink(input, url) {
  if (!input) return;

  const cleanUrl = (url || "").trim();
  if (cleanUrl) {
    input.dataset.link = cleanUrl;
  } else {
    delete input.dataset.link;
  }
}

function normalizeUrl(url) {
  const value = (url || "").trim();
  if (!value) return "";

  if (/^[a-zA-Z]+:/.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;

  return "https://" + value;
}

function buildTypedLink(type, rawValue) {
  const value = (rawValue || "").trim();
  if (!value) return "";

  if (type === "website") {
    return normalizeUrl(value);
  }

  if (type === "phone") {
    return `tel:${value}`;
  }

  if (type === "email") {
    return `mailto:${value}`;
  }

  if (type === "whatsapp") {
    const cleaned = value.replace(/[^\d]/g, "");
    return cleaned ? `https://wa.me/${cleaned}` : "";
  }

  return value;
}

function refreshRowLinkButtonsState() {
  document.querySelectorAll("input[name='item']").forEach((input) => {
    const wrap = input.closest(".input-with-link");
    if (!wrap) return;

    const websiteBtn = wrap.querySelector('[title="Website link"]');
    const phoneBtn = wrap.querySelector('[title="Phone link"]');
    const emailBtn = wrap.querySelector('[title="Email link"]');
    const whatsappBtn = wrap.querySelector('[title="WhatsApp link"]');

    [websiteBtn, phoneBtn, emailBtn, whatsappBtn].forEach(btn => {
      if (btn) btn.classList.remove("active");
    });

    const url = getInputLink(input);

    if (/^tel:/i.test(url)) {
      phoneBtn?.classList.add("active");
    } else if (/^mailto:/i.test(url)) {
      emailBtn?.classList.add("active");
    } else if (/^https?:\/\/wa\.me\//i.test(url)) {
      whatsappBtn?.classList.add("active");
    } else if (url) {
      websiteBtn?.classList.add("active");
    }
  });
}

function saveList() {
  const title = document.getElementById("title").value.trim() || `Untitled List`;
  const inputs = Array.from(document.querySelectorAll("input[name='item']"));
  const values = inputs.map(input => input.value.trim());
  const note = document.getElementById("form-note")?.value.trim() || "";

  let saved = JSON.parse(sessionStorage.getItem("savedLists") || "{}");

  if (!saved[sessionId]) saved[sessionId] = [];
  saved[sessionId].push({ title, values, note });
  sessionStorage.setItem("savedLists", JSON.stringify(saved));
  alert("List saved to session.");
}

function openWorkspace() {
  const workspace = document.getElementById("workspace");
  const saved = JSON.parse(sessionStorage.getItem("savedLists") || "{}");
  const lists = saved[sessionId] || [];

  if (lists.length === 0) {
    workspace.innerHTML = "<p>No lists saved.</p>";
    return;
  }

  let html = "<h4>My Saved Lists</h4><table style='width: 100%; border-collapse: collapse;'>";
  html += "<thead><tr><th style='text-align:left; padding: 4px;'>List</th><th></th></tr></thead><tbody>";

  lists.forEach((list, i) => {
    html += `<tr>
      <td style='padding: 4px;'><a href="#" onclick="loadList(${i})">${list.title || 'List ' + (i + 1)}</a></td>
      <td style='padding: 4px;'><button onclick="deleteList(${i})">Delete</button></td>
    </tr>`;
  });

  html += "</tbody></table>";
  workspace.innerHTML = html;
}

function loadList(index) {
  const saved = JSON.parse(sessionStorage.getItem("savedLists") || "{}");
  const lists = saved[sessionId] || [];
  const list = lists[index];
  if (!list) return;

  document.getElementById("title").value = list.title;
  createItemInputs(list.values.length, currentColumns);

  const inputs = document.querySelectorAll("input[name='item']");
  list.values.forEach((val, i) => {
    if (inputs[i]) inputs[i].value = val;
  });

  updatePreview();

  if (list.note !== undefined) {
    let noteBox = document.getElementById("form-note");
    if (!noteBox) {
      appendFlexibleNoteArea();
      noteBox = document.getElementById("form-note");
    }
    if (noteBox) noteBox.value = list.note;
  }
}

function deleteList(index) {
  let saved = JSON.parse(sessionStorage.getItem("savedLists") || "{}");
  if (!saved[sessionId]) return;
  saved[sessionId].splice(index, 1);
  sessionStorage.setItem("savedLists", JSON.stringify(saved));
  openWorkspace();
}

function toggleSection(id) {
  document.getElementById(id).classList.toggle("active");
}

function normalizeItemCountForColumns(count, columns = 1) {
  const safeCount = Math.max(0, Number(count) || 0);
  const safeColumns = Math.min(3, Math.max(1, Number(columns) || 1));

  if (safeColumns === 1) return safeCount;

  return Math.ceil(safeCount / safeColumns) * safeColumns;
}

// Create the rows with the input fields
function createItemInputs(count, columns = 1) {
  count = normalizeItemCountForColumns(count, columns);

  itemsContainer.innerHTML = '';
  currentColumns = Math.min(3, Math.max(1, Number(columns) || 1));

  const rtContainer = document.getElementById('richTextContainer');
  if (rtContainer) rtContainer.classList.remove('form-note-area');

  const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
  if (toggleNoteAreaBtn) {
    toggleNoteAreaBtn.classList.remove('active');
  }

  let row;

  for (let i = 1; i <= count; i++) {
    const label = document.createElement('label');
    label.textContent = `Item ${i}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'item';
    input.className = 'list-item';
    input.placeholder = 'Enter list item';
    input.addEventListener('input', updatePreview);

    const websiteBtn = document.createElement('button');
    websiteBtn.type = 'button';
    websiteBtn.className = 'row-link-btn hidden-link-btn';
    websiteBtn.title = 'Website link';
    websiteBtn.innerHTML = '<span class="material-icons">language</span>';

    const phoneBtn = document.createElement('button');
    phoneBtn.type = 'button';
    phoneBtn.className = 'row-link-btn hidden-link-btn';
    phoneBtn.title = 'Phone link';
    phoneBtn.innerHTML = '<span class="material-icons">call</span>';

    const emailBtn = document.createElement('button');
    emailBtn.type = 'button';
    emailBtn.className = 'row-link-btn hidden-link-btn';
    emailBtn.title = 'Email link';
    emailBtn.innerHTML = '<span class="material-icons">email</span>';

    const whatsappBtn = document.createElement('button');
    whatsappBtn.type = 'button';
    whatsappBtn.className = 'row-link-btn hidden-link-btn';
    whatsappBtn.title = 'WhatsApp link';
    whatsappBtn.innerHTML = '<span class="material-icons">chat</span>';

    function handleTypedLinkClick(type, buttonEl) {
      const currentUrl = getInputLink(input);
      const entered = prompt(`Enter ${type} value:`, currentUrl || '');

      if (entered === null) return;

      const finalUrl = buildTypedLink(type, entered);

      websiteBtn.classList.remove('active');
      phoneBtn.classList.remove('active');
      emailBtn.classList.remove('active');
      whatsappBtn.classList.remove('active');

      if (!finalUrl) {
        setInputLink(input, "");
      } else {
        setInputLink(input, finalUrl);
        buttonEl.classList.add('active');
      }

      updatePreview();
    }

    websiteBtn.addEventListener('click', () => handleTypedLinkClick('website', websiteBtn));
    phoneBtn.addEventListener('click', () => handleTypedLinkClick('phone', phoneBtn));
    emailBtn.addEventListener('click', () => handleTypedLinkClick('email', emailBtn));
    whatsappBtn.addEventListener('click', () => handleTypedLinkClick('whatsapp', whatsappBtn));

    if (currentColumns === 1) {
      const r = document.createElement('div');
      r.className = 'inputs-row';

      const cbCell = document.createElement('div');
      cbCell.className = 'row-checkbox';
      if (!checkboxesEnabled) cbCell.classList.add('hidden-checkbox');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'row-check';
      cb.addEventListener('change', updatePreview);
      cbCell.appendChild(cb);

      const content = document.createElement('div');
      content.className = 'row-content';

      const inputWrap = document.createElement('div');
      inputWrap.className = 'input-with-link';

      const linkButtonsWrap = document.createElement('div');
      linkButtonsWrap.className = 'row-link-buttons';

      linkButtonsWrap.appendChild(websiteBtn);
      linkButtonsWrap.appendChild(phoneBtn);
      linkButtonsWrap.appendChild(emailBtn);
      linkButtonsWrap.appendChild(whatsappBtn);

      inputWrap.appendChild(input);
      inputWrap.appendChild(linkButtonsWrap);

      content.appendChild(label);
      content.appendChild(inputWrap);

      r.appendChild(cbCell);
      r.appendChild(content);
      itemsContainer.appendChild(r);

    } else {
      if ((i - 1) % currentColumns === 0) {
        row = document.createElement('div');
        row.className = 'inputs-row';

        const cbCell = document.createElement('div');
        cbCell.className = 'row-checkbox';
        if (!checkboxesEnabled) cbCell.classList.add('hidden-checkbox');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'row-check';
        cb.addEventListener('change', updatePreview);
        cbCell.appendChild(cb);

        row.appendChild(cbCell);
        itemsContainer.appendChild(row);
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'column-input-wrapper';
      wrapper.style.flex = '1';
      wrapper.style.minWidth = '0';

      label.style.display = 'block';
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';

      const inputWrap = document.createElement('div');
      inputWrap.className = 'input-with-link';

      const linkButtonsWrap = document.createElement('div');
      linkButtonsWrap.className = 'row-link-buttons';

      linkButtonsWrap.appendChild(websiteBtn);
      linkButtonsWrap.appendChild(phoneBtn);
      linkButtonsWrap.appendChild(emailBtn);
      linkButtonsWrap.appendChild(whatsappBtn);

      inputWrap.appendChild(input);
      inputWrap.appendChild(linkButtonsWrap);

      wrapper.appendChild(label);
      wrapper.appendChild(inputWrap);

      row.appendChild(wrapper);
    }
  }

  updatePreview();
  updateRowControls();
  updateColumnControls();

  if (typeof syncCheckboxVisibility === 'function') {
    syncCheckboxVisibility();
  }

  if (typeof syncLinkVisibility === 'function') {
    syncLinkVisibility();
  }

  refreshRowLinkButtonsState();
}

function applySignupListTemplate() {
  signupEnabled = true;
  signupVisibility = "private";

  const titleInput = document.getElementById("title");
  const signupBtn = document.getElementById("toggleSignupListBtn");

  if (signupBtn) {
    signupBtn.classList.add("active");
  }

  if (titleInput && !titleInput.value.trim()) {
    titleInput.value = "Signup List";
  }

  if (currentColumns < 3) {
    createItemInputs(3, 3);
  }

  signupFields = ["Name", "Email", "Phone"];

  const inputs = Array.from(document.querySelectorAll("input[name='item']"));

  if (inputs[0]) inputs[0].value = "Name";
  if (inputs[1]) inputs[1].value = "Email";
  if (inputs[2]) inputs[2].value = "Phone";

  updatePreview();
}

// Create form - unhides the div for the text area
function appendFlexibleNoteArea() {
  console.log("appendFlexibleNoteArea was called");

  const container = document.getElementById('richTextContainer');
  const editor = document.getElementById('editor');

  if (!container || !editor) return;

  container.classList.add('form-note-area');

  const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
  if (toggleNoteAreaBtn) {
    toggleNoteAreaBtn.classList.add('active');
  }

  editor.style.width = '100%';
  editor.style.minHeight = '100px';
  editor.style.padding = '10px';
  editor.style.fontSize = '16px';
  editor.style.border = '1px solid #ccc';
  editor.style.borderRadius = '6px';
  editor.style.backgroundColor = '#fafafa';

  editor.removeEventListener('keyup', updatePreview);
  editor.addEventListener('keyup', updatePreview);
}

function getInputRating(input) {
  return Math.max(0, Math.min(5, Number(input?.dataset?.rating || 0)));
}

function createPreviewStars(rating) {
  const starsWrap = document.createElement('div');
  starsWrap.className = 'preview-stars';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = i <= rating ? 'preview-star filled' : 'preview-star';
    star.textContent = i <= rating ? '★' : '☆';
    starsWrap.appendChild(star);
  }

  return starsWrap;
}

function updatePreview() {
  previewTitle.textContent = titleInput.value.trim() || 'Your list title...';
  previewItems.innerHTML = '';

  const allItems = Array.from(document.querySelectorAll("input[name='item']"));
  const formRowCheckboxes = Array.from(document.querySelectorAll(".row-check"));

  if (currentColumns > 1) {
    for (let i = 0; i < allItems.length; i += currentColumns) {
      const rowLi = document.createElement('li');
      rowLi.className = 'preview-row';
      rowLi.classList.add(`col-${currentColumns}`);

      const previewCb = document.createElement('input');
      previewCb.type = 'checkbox';
      previewCb.className = 'preview-check';

      const formCb = formRowCheckboxes[Math.floor(i / currentColumns)];
      if (formCb && formCb.checked) previewCb.checked = true;
      if (!checkboxesEnabled) previewCb.classList.add('hidden-checkbox');

      previewCb.addEventListener('change', function () {
        if (formCb) formCb.checked = this.checked;
        if (this.checked) rowLi.classList.add('completed');
        else rowLi.classList.remove('completed');
      });

      rowLi.appendChild(previewCb);

      for (let j = 0; j < currentColumns; j++) {
        const col = document.createElement('div');
        col.className = 'preview-col';

        const itemInput = allItems[i + j];
        const itemText = itemInput?.value.trim() || '...';
        const itemLink = getInputLink(itemInput);
        const itemRating = getInputRating(itemInput);
        const isDateInput = itemInput?.type === "date";
        const textWrap = document.createElement('div');
        textWrap.className = 'preview-item-text';

        if (isDateInput && itemText !== '...') {
          textWrap.classList.add("preview-date");
          textWrap.textContent = itemText;
        } else if (itemLink && itemText !== '...') {
          const a = document.createElement('a');
          a.href = itemLink;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'preview-link';
          a.textContent = itemText;
          textWrap.appendChild(a);
        } else {
          textWrap.textContent = itemText;
        }

        col.appendChild(textWrap);

        if (itemRating > 0) {
          col.appendChild(createPreviewStars(itemRating));
        }

        rowLi.appendChild(col);
      }

      if (formCb && formCb.checked) rowLi.classList.add('completed');

      previewItems.appendChild(rowLi);
    }
  } else {
    allItems.forEach((input, index) => {
      const li = document.createElement('li');
      li.className = 'preview-row col-1';

      const previewCb = document.createElement('input');
      previewCb.type = 'checkbox';
      previewCb.className = 'preview-check';

      const formCb = formRowCheckboxes[index];
      if (formCb && formCb.checked) previewCb.checked = true;
      if (!checkboxesEnabled) previewCb.classList.add('hidden-checkbox');

      previewCb.addEventListener('change', function () {
        if (formCb) formCb.checked = this.checked;
        if (this.checked) li.classList.add('completed');
        else li.classList.remove('completed');
      });

      li.appendChild(previewCb);

      const contentWrap = document.createElement('div');
      contentWrap.className = 'preview-item-content';

      const textWrap = document.createElement('div');
      textWrap.className = 'preview-item-text';

      const itemText = input.value.trim() || '...';
      const itemLink = getInputLink(input);
      const itemRating = getInputRating(input);

      if (itemLink && itemText !== '...') {
        const a = document.createElement('a');
        a.href = itemLink;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'preview-link';
        a.textContent = itemText;
        textWrap.appendChild(a);
      } else {
        textWrap.textContent = itemText;
      }

      contentWrap.appendChild(textWrap);

      if (itemRating > 0) {
        contentWrap.appendChild(createPreviewStars(itemRating));
      }

      li.appendChild(contentWrap);

      if (formCb && formCb.checked) li.classList.add('completed');

      previewItems.appendChild(li);
    });
  }

  const noteTextarea = document.getElementById('editor');
  const notePreview = document.getElementById('notePreview');
  if (noteTextarea && notePreview) {
    notePreview.innerHTML = noteTextarea.innerHTML.trim();
  }
}

const titleInput = document.getElementById("title");
const previewTitle = document.getElementById("previewTitle");
const previewItems = document.getElementById("previewItems");
const itemsContainer = document.getElementById("itemsContainer");

if (titleInput) {
  titleInput.addEventListener("input", updatePreview);
}

document.querySelectorAll(".sidebar a.option").forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const documentList = document.getElementById("documentList");
    if (documentList) documentList.style.display = "none";

    const count = parseInt(this.dataset.count, 10);
    const columns = parseInt(this.dataset.columns, 10);
    const totalInputs = columns === 2 ? count * 2 : count;

    createItemInputs(totalInputs, columns);
    sessionStorage.removeItem('currentListId');

    const saveBtn = document.getElementById('saveCloudBtn');
    if (saveBtn) {
        saveBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM6 8V5h9v3H6z"></path>
          </svg>
        `;
        saveBtn.title = "Save to Cloud";
        saveBtn.setAttribute("aria-label", "Save to Cloud");
      }
  });
});

document.querySelectorAll(".sidebar a.option-3col").forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const documentList = document.getElementById("documentList");
    if (documentList) documentList.style.display = "none";

    const rows = parseInt(this.dataset.count, 10);
    const totalInputs = rows * 3;

    createItemInputs(totalInputs, 3);
    sessionStorage.removeItem('currentListId');

    const saveBtn = document.getElementById('saveCloudBtn');
    if (saveBtn) saveBtn.textContent = 'Save to Cloud';
  });
});

// Initialize default list
createItemInputs(5);

// Add rows
function addRow() {
  const inputsPerRow = currentColumns;
  const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
  const newTotal = currentInputs.length + inputsPerRow;

  const existingValues = currentInputs.map(input => ({
    value: input.value.trim(),
    link: getInputLink(input)
  }));

  const editor = document.getElementById('editor');
  const container = document.getElementById('richTextContainer');
  const noteWasVisible = container?.classList.contains('form-note-area');
  const noteContent = editor?.innerHTML.trim() || "";

  createItemInputs(newTotal, currentColumns);

  const allInputs = document.querySelectorAll("input[name='item']");
  existingValues.forEach((item, i) => {
    if (allInputs[i]) {
      allInputs[i].value = item.value;
      setInputLink(allInputs[i], item.link);
    }
  });

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);

    const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
    if (toggleNoteAreaBtn) toggleNoteAreaBtn.classList.add('active');
  }

  refreshRowLinkButtonsState();

  allInputs[newTotal - 1]?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  updatePreview();
  updateRowControls();
  updateColumnControls();
}

function deleteRow() {
  const inputsPerRow = currentColumns;
  const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));

  if (currentInputs.length === 0) return;

  const newTotal = Math.max(0, currentInputs.length - inputsPerRow);
  const remainingValues = currentInputs.slice(0, newTotal).map(input => ({
    value: input.value.trim(),
    link: getInputLink(input)
  }));

  const editor = document.getElementById('editor');
  const container = document.getElementById('richTextContainer');
  const noteWasVisible = container?.classList.contains('form-note-area');
  const noteContent = editor?.innerHTML.trim() || "";

  createItemInputs(newTotal, currentColumns);

  const allInputs = document.querySelectorAll("input[name='item']");
  remainingValues.forEach((item, i) => {
    if (allInputs[i]) {
      allInputs[i].value = item.value;
      setInputLink(allInputs[i], item.link);
    }
  });

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);

    const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
    if (toggleNoteAreaBtn) toggleNoteAreaBtn.classList.add('active');
  }

  refreshRowLinkButtonsState();

  updateRowControls();
  updateColumnControls();

  try {
    updatePreview();
  } catch {}
}

function addColumn() {
  if (currentColumns >= 3) return;

  const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
  const existingValues = currentInputs.map(input => ({
    value: input.value.trim(),
    link: getInputLink(input)
  }));

  const oldColumns = currentColumns;
  const currentRows = oldColumns > 0
    ? Math.ceil(currentInputs.length / oldColumns)
    : 0;

  const newColumns = oldColumns + 1;
  const newTotal = currentRows * newColumns;

  const editor = document.getElementById('editor');
  const container = document.getElementById('richTextContainer');
  const noteWasVisible = container?.classList.contains('form-note-area');
  const noteContent = editor?.innerHTML.trim() || "";

  createItemInputs(newTotal, newColumns);

  const allInputs = document.querySelectorAll("input[name='item']");

  // Preserve old columns exactly where they were, row by row
  for (let row = 0; row < currentRows; row++) {
    for (let col = 0; col < oldColumns; col++) {
      const oldIndex = row * oldColumns + col;
      const newIndex = row * newColumns + col;

      if (allInputs[newIndex]) {
        const oldItem = existingValues[oldIndex] || { value: "", link: "" };
        allInputs[newIndex].value = oldItem.value || "";
        setInputLink(allInputs[newIndex], oldItem.link || "");
      }
    }
    // The new last column in each row stays blank on purpose
  }

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);

    const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
    if (toggleNoteAreaBtn) toggleNoteAreaBtn.classList.add('active');
  }

  refreshRowLinkButtonsState();

  updatePreview();
  updateRowControls();
  updateColumnControls();
}

function deleteColumn() {
  if (currentColumns <= 1) return;

  const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
  const existingValues = currentInputs.map(input => ({
    value: input.value.trim(),
    link: getInputLink(input)
  }));

  const currentRows = Math.ceil(currentInputs.length / currentColumns);
  const newColumns = currentColumns - 1;
  const newTotal = currentRows * newColumns;

  const keptValues = existingValues.slice(0, newTotal);

  const editor = document.getElementById('editor');
  const container = document.getElementById('richTextContainer');
  const noteWasVisible = container?.classList.contains('form-note-area');
  const noteContent = editor?.innerHTML.trim() || "";

  createItemInputs(newTotal, newColumns);

  const allInputs = document.querySelectorAll("input[name='item']");
  keptValues.forEach((item, i) => {
    if (allInputs[i]) {
      allInputs[i].value = item.value;
      setInputLink(allInputs[i], item.link);
    }
  });

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);

    const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
    if (toggleNoteAreaBtn) toggleNoteAreaBtn.classList.add('active');
  }

  refreshRowLinkButtonsState();

  updatePreview();
  updateRowControls();
  updateColumnControls();
}

// do not delete last input row
function updateRowControls() {
  const inputs = document.querySelectorAll("input[name='item']");
  const deleteButton = document.getElementById("deleteRowBtn");
  const inputsPerRow = currentColumns;

  if (deleteButton) {
    deleteButton.disabled = inputs.length <= inputsPerRow;
  }
}

function updateColumnControls() {
  const addColumnBtn = document.getElementById("addColumnBtn");
  const deleteColumnBtn = document.getElementById("deleteColumnBtn");

  if (addColumnBtn) {
    addColumnBtn.disabled = currentColumns >= 3;
  }

  if (deleteColumnBtn) {
    deleteColumnBtn.disabled = currentColumns <= 1;
  }
}

// text area editor
function execCmd(command, value = null) {
  document.execCommand(command, false, value);
}

// Toggle visibility of all row checkboxes
const toggleBtn = document.getElementById('toggleCheckboxesBtn');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    checkboxesEnabled = !checkboxesEnabled;

    toggleBtn.classList.toggle('active', checkboxesEnabled);

    const icon = toggleBtn.querySelector('.material-icons');
    if (icon) {
      icon.textContent = checkboxesEnabled ? 'check_box' : 'check_box_outline_blank';
    }

    syncCheckboxVisibility();
  });
} else {
  console.warn('Checkboxes button not found: #toggleCheckboxesBtn');
}

function syncCheckboxVisibility() {
  document.querySelectorAll('.row-checkbox').forEach(cell => {
    cell.classList.toggle('hidden-checkbox', !checkboxesEnabled);
  });

  document.querySelectorAll('.preview-check').forEach(cb => {
    cb.classList.toggle('hidden-checkbox', !checkboxesEnabled);
  });

  const previewList = document.getElementById('previewItems');
  if (previewList) {
    previewList.classList.toggle('checkboxes-on', checkboxesEnabled);
  }
}

function syncLinkVisibility() {
  document.querySelectorAll('.row-link-btn').forEach(btn => {
    btn.classList.toggle('hidden-link-btn', !linksEnabled);
  });
}

const toggleLinksBtn = document.getElementById('toggleLinksBtn');
if (toggleLinksBtn) {
  toggleLinksBtn.addEventListener('click', () => {
    linksEnabled = !linksEnabled;
    toggleLinksBtn.classList.toggle('active', linksEnabled);
    syncLinkVisibility();
  });
}

// Toggle Note Area visibility
const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
if (toggleNoteAreaBtn) {
  toggleNoteAreaBtn.addEventListener('click', () => {
    const container = document.getElementById('richTextContainer');
    const editor = document.getElementById('editor');

    if (!container) return;

    const isOpen = container.classList.contains('form-note-area');

    if (isOpen) {
      container.classList.remove('form-note-area');
      toggleNoteAreaBtn.classList.remove('active');
    } else {
      container.classList.add('form-note-area');
      toggleNoteAreaBtn.classList.add('active');
    }

    if (editor) {
      editor.removeEventListener('keyup', updatePreview);
      editor.addEventListener('keyup', updatePreview);
    }
  });
}

const toggleSignupListBtn = document.getElementById("toggleSignupListBtn");

if (toggleSignupListBtn) {
    toggleSignupListBtn.addEventListener("click", () => {
    if (signupEnabled) {
      return;
    }

    applySignupListTemplate();
    updatePreview();
  });
}

function resetListImagesForNewList() {
  console.log("clearing out previous list data");

  // Clear sessionStorage image values used by saveToFirestore.js
  sessionStorage.removeItem("headerImage");
  sessionStorage.removeItem("headerImagePath");
  sessionStorage.removeItem("footerImage");
  sessionStorage.removeItem("footerImagePath");
  

  // Also clear older/alternate names
  sessionStorage.removeItem("headerImageUrl");
  sessionStorage.removeItem("footerImageUrl");
  sessionStorage.removeItem("currentHeaderImageUrl");
  sessionStorage.removeItem("currentHeaderImagePath");
  sessionStorage.removeItem("currentFooterImageUrl");
  sessionStorage.removeItem("currentFooterImagePath");

  // Clear image variables
  window.currentHeaderImageUrl = "";
  window.currentHeaderImagePath = "";
  window.currentFooterImageUrl = "";
  window.currentFooterImagePath = "";

  // Also clear legacy variables if still used somewhere
  window.headerImageUrl = "";
  window.headerImagePath = "";
  window.footerImageUrl = "";
  window.footerImagePath = "";

  // Clear current list id
  sessionStorage.removeItem("currentListId");

  // Clear title input
  const titleInput = document.getElementById("title");
  if (titleInput) {
    titleInput.value = "";
  }

  // Clear preview title
  const previewTitle = document.getElementById("previewTitle");
  if (previewTitle) {
    previewTitle.textContent = "Your list title...";
  }

  // Clear file inputs
  const headerInput = document.getElementById("headerImageInput");
  const footerInput = document.getElementById("footerImageInput");

  if (headerInput) headerInput.value = "";
  if (footerInput) footerInput.value = "";

  // Clear preview image tags
  const previewHeaderImg = document.getElementById("previewHeaderImage");
  const previewFooterImg = document.getElementById("previewFooterImage");

  if (previewHeaderImg) {
    previewHeaderImg.removeAttribute("src");
  }

  if (previewFooterImg) {
    previewFooterImg.removeAttribute("src");
  }

  // Clear editor preview containers
  const headerPreview = document.getElementById("headerPreview");
  const footerPreview = document.getElementById("footerPreview");

  if (headerPreview) {
    headerPreview.innerHTML = "";
  }

  if (footerPreview) {
    footerPreview.innerHTML = "";
  }

  signupEnabled = false;
  signupVisibility = "private";
  signupFields = ["Name", "Email", "Phone"];

  const signupBtn = document.getElementById("toggleSignupListBtn");
  if (signupBtn) {
    signupBtn.classList.remove("active");
  }

}

function getSignupFieldsFromInputs() {
  const inputs = Array.from(document.querySelectorAll("input[name='item']"));

  const fields = inputs
    .slice(0, currentColumns)
    .map(input => input.value.trim())
    .filter(Boolean);

  return fields.length ? fields : ["Name", "Email", "Phone"];
}

window.getSignupEnabled = function () {
  return signupEnabled === true;
};

window.getSignupVisibility = function () {
  return signupVisibility || "private";
};

window.getSignupFields = function () {
  if (signupEnabled) {
    signupFields = getSignupFieldsFromInputs();
  }

  return signupFields;
};

window.setSignupEnabled = function (value) {
  signupEnabled = value === true;

  const signupBtn = document.getElementById("toggleSignupListBtn");
  if (signupBtn) {
    signupBtn.classList.toggle("active", signupEnabled);
  }

  if (signupEnabled) {
    const inputs = document.querySelectorAll("input[name='item']");

    signupFields.forEach((field, index) => {
      if (inputs[index]) {
        inputs[index].value = field;
      }
    });

    if (typeof updatePreview === "function") {
      updatePreview();
    }
  }
};

window.setSignupVisibility = function (value) {
  signupVisibility = value || "private";
};

window.setSignupFields = function (fields) {
  signupFields = Array.isArray(fields) && fields.length
    ? fields
    : ["Name", "Email", "Phone"];
};


window.updatePreview = updatePreview;
window.createItemInputs = createItemInputs;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.addColumn = addColumn;
window.deleteColumn = deleteColumn;
window.refreshRowLinkButtonsState = refreshRowLinkButtonsState;
window.resetListImagesForNewList = resetListImagesForNewList;