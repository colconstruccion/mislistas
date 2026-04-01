let sessionId = sessionStorage.getItem("sessionId") || crypto.randomUUID();
sessionStorage.setItem("sessionId", sessionId);

let currentColumns = 1;
let checkboxesEnabled = false; // default hidden

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
      content.appendChild(label);
      content.appendChild(input);

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

      wrapper.appendChild(label);
      wrapper.appendChild(input);

      row.appendChild(wrapper);
    }
  }

  updatePreview();
  updateRowControls();
  updateColumnControls();

  if (typeof syncCheckboxVisibility === 'function') {
    syncCheckboxVisibility();
  }
}

// Create form - unhides the div for the text area
function appendFlexibleNoteArea() {
  console.log("appendFlexibleNoteArea was called");

  const container = document.getElementById('richTextContainer');
  const editor = document.getElementById('editor');

  if (!container || !editor) return;

  container.classList.add('form-note-area');

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
        col.textContent = allItems[i + j]?.value.trim() || '...';
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

      const col = document.createElement('div');
      col.textContent = input.value.trim() || '...';
      li.appendChild(col);

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
    if (saveBtn) saveBtn.textContent = 'Save to Cloud';
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

  const existingValues = currentInputs.map(input => input.value.trim());

  const editor = document.getElementById('editor');
  const container = document.getElementById('richTextContainer');
  const noteWasVisible = container?.classList.contains('form-note-area');
  const noteContent = editor?.innerHTML.trim() || "";

  createItemInputs(newTotal, currentColumns);

  const allInputs = document.querySelectorAll("input[name='item']");
  existingValues.forEach((val, i) => {
    if (allInputs[i]) allInputs[i].value = val;
  });

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);
  }

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
  const remainingValues = currentInputs.slice(0, newTotal).map(input => input.value.trim());

  const editor = document.getElementById('editor');
  const container = document.getElementById('richTextContainer');
  const noteWasVisible = container?.classList.contains('form-note-area');
  const noteContent = editor?.innerHTML.trim() || "";

  createItemInputs(newTotal, currentColumns);

  const allInputs = document.querySelectorAll("input[name='item']");
  remainingValues.forEach((val, i) => {
    if (allInputs[i]) allInputs[i].value = val;
  });

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);
  }

  updateRowControls();
  updateColumnControls();

  try {
    updatePreview();
  } catch {}
}

function addColumn() {
  if (currentColumns >= 3) return;

  const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
  const existingValues = currentInputs.map(input => input.value.trim());

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
        allInputs[newIndex].value = existingValues[oldIndex] || "";
      }
    }
    // The new last column in each row stays blank on purpose
  }

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);
  }

  updatePreview();
  updateRowControls();
  updateColumnControls();
}

function deleteColumn() {
  if (currentColumns <= 1) return;

  const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
  const existingValues = currentInputs.map(input => input.value.trim());

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
  keptValues.forEach((val, i) => {
    if (allInputs[i]) allInputs[i].value = val;
  });

  if (noteWasVisible && container && editor) {
    container.classList.add('form-note-area');
    editor.innerHTML = noteContent;
    editor.removeEventListener('keyup', updatePreview);
    editor.addEventListener('keyup', updatePreview);
  }

  updatePreview();
  updateRowControls();
  updateColumnControls();
}

// do not delete last input row
function updateRowControls() {
  const inputs = document.querySelectorAll("input[name='item']");
  const deleteButton = document.querySelector("button[onclick='deleteRow()']");
  const inputsPerRow = currentColumns;

  if (deleteButton) {
    deleteButton.disabled = inputs.length <= inputsPerRow;
  }
}

function updateColumnControls() {
  const addColumnBtn = document.querySelector("button[onclick='addColumn()']");
  const deleteColumnBtn = document.querySelector("button[onclick='deleteColumn()']");

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

// Toggle Note Area visibility
const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
if (toggleNoteAreaBtn) {
  toggleNoteAreaBtn.addEventListener('click', () => {
    const container = document.getElementById('richTextContainer');
    const editor = document.getElementById('editor');

    if (!container) return;

    if (container.classList.contains('form-note-area')) {
      container.classList.remove('form-note-area');
    } else {
      container.classList.add('form-note-area');
    }

    if (editor) {
      editor.removeEventListener('keyup', updatePreview);
      editor.addEventListener('keyup', updatePreview);
    }
  });
}

window.updatePreview = updatePreview;
window.createItemInputs = createItemInputs;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.addColumn = addColumn;
window.deleteColumn = deleteColumn;