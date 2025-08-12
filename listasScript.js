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
      list.values.forEach((val, i) => inputs[i] && (inputs[i].value = val));
      updatePreview();
      //text area
      // Restore note
      if (list.note !== undefined) {
        let noteBox = document.getElementById("form-note");
        if (!noteBox) {
            appendFlexibleNoteArea();
            noteBox = document.getElementById("form-note");
        }
        noteBox.value = list.note;
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


    //Create the rows with the input fields
    function createItemInputs(count, columns = 1) {
      itemsContainer.innerHTML = '';
      currentColumns = columns;

      const rtContainer = document.getElementById('richTextContainer');
      rtContainer.classList.remove('form-note-area');

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

        if (columns === 1) {
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
          if ((i - 1) % columns === 0) {
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
          wrapper.appendChild(label);
          wrapper.appendChild(input);

          if (columns === 2) {
            wrapper.style.flex = '1';
          } else if (columns === 3) {
            if ((i - 1) % 3 === 0) wrapper.style.flex = '2';
            else wrapper.style.flex = '1';
          }

          row.appendChild(wrapper);
        }
      }

      updatePreview();
      updateRowControls();

      if (typeof syncCheckboxVisibility === 'function') {
        syncCheckboxVisibility();
      }
    }



    //Create form - unhides the div for the text area
    function appendFlexibleNoteArea() {
      console.log("appendFlexibleNoteArea was called");

      const container = document.getElementById('richTextContainer');
      const editor = document.getElementById('editor');

      // Unhide using class
      container.classList.add('form-note-area');

      // Apply styles
      editor.style.width = '100%';
      editor.style.minHeight = '100px';
      editor.style.padding = '10px';
      editor.style.fontSize = '16px';
      editor.style.border = '1px solid #ccc';
      editor.style.borderRadius = '6px';
      editor.style.backgroundColor = '#fafafa';

      // Set up preview update listener
      editor.removeEventListener('keyup', updatePreview);
      editor.addEventListener('keyup', updatePreview);
    }

    function updatePreview() {
      previewTitle.textContent = titleInput.value.trim() || 'Your list title...';
      previewItems.innerHTML = '';

      const allItems = Array.from(document.querySelectorAll("input[name='item']"));
      const formRowCheckboxes = Array.from(document.querySelectorAll(".row-check"));

      if (currentColumns === 2 || currentColumns === 3) {
        for (let i = 0; i < allItems.length; i += currentColumns) {
          const rowLi = document.createElement('li');
          rowLi.className = 'preview-row';
          rowLi.classList.add(`col-${currentColumns}`);

          // Preview left checkbox
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

          // Text columns
          for (let j = 0; j < currentColumns; j++) {
            const col = document.createElement('div');
            col.textContent = allItems[i + j]?.value.trim() || '...';
            rowLi.appendChild(col);
          }

          if (formCb && formCb.checked) rowLi.classList.add('completed');

          previewItems.appendChild(rowLi);
        }
      } else {
          // Single-column: one preview row per item; one checkbox per item (left)
          allItems.forEach((input, index) => {
          const li = document.createElement('li');
          li.className = 'preview-row col-1';

          // --- Preview left checkbox ---
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

          // --- Text column as a div (keeps grid consistent) ---
          const col = document.createElement('div');
          col.textContent = input.value.trim() || '...';
          li.appendChild(col);

          if (formCb && formCb.checked) li.classList.add('completed');

          previewItems.appendChild(li);
        });
      }

      // Note content
      const noteTextarea = document.getElementById('editor');
      const notePreview = document.getElementById('notePreview');
      if (noteTextarea && notePreview) {
        notePreview.innerHTML = noteTextarea.innerHTML.trim();
      }
    }



    const titleInput = document.getElementById("title");
    const previewItems = document.getElementById("previewItems");
    const itemsContainer = document.getElementById("itemsContainer");
    titleInput.addEventListener("input", updatePreview);

    document.querySelectorAll(".sidebar a.option").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const count = parseInt(this.dataset.count, 10);
        const columns = parseInt(this.dataset.columns, 10);
        const totalInputs = columns === 2 ? count * 2 : count;
        createItemInputs(totalInputs, columns);
      });
    });    

    document.querySelectorAll(".sidebar a.option-3col").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const rows = parseInt(this.dataset.count, 10);
        const totalInputs = rows * 3;
        createItemInputs(totalInputs, 3);
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

      // ✅ Preserve current rich text content
      const editor = document.getElementById('editor');
      const noteContent = editor?.innerHTML.trim() || "";

      createItemInputs(newTotal, currentColumns);

      // Restore input values
      const allInputs = document.querySelectorAll("input[name='item']");
      existingValues.forEach((val, i) => allInputs[i].value = val);

      // ✅ Re-append note box if visible before
      const container = document.getElementById('richTextContainer');
      if (container && container.classList.contains('form-note-area')) {
        container.classList.add('form-note-area'); // Ensure visible
        editor.innerHTML = noteContent; // Restore content
        editor.removeEventListener('keyup', updatePreview);
        editor.addEventListener('keyup', updatePreview);
      }

      allInputs[newTotal - 1]?.scrollIntoView({ behavior: 'smooth', block: 'end' });

      updatePreview();
      updateRowControls();
    }


    function deleteRow() {
      const inputsPerRow = currentColumns;
      const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
      if (currentInputs.length <= inputsPerRow) return;

      const newTotal = currentInputs.length - inputsPerRow;
      const remainingValues = currentInputs.slice(0, newTotal).map(input => input.value.trim());

      // ✅ Preserve current note content
      const editor = document.getElementById('editor');
      const noteContent = editor?.innerHTML.trim() || "";

      createItemInputs(newTotal, currentColumns);

      // Restore input values
      const allInputs = document.querySelectorAll("input[name='item']");
      remainingValues.forEach((val, i) => allInputs[i].value = val);

      // ✅ Restore note if it was visible before
      const container = document.getElementById('richTextContainer');
      if (container && container.classList.contains('form-note-area')) {
        container.classList.add('form-note-area'); // Ensure it's shown
        editor.innerHTML = noteContent;            // Restore content
        editor.removeEventListener('keyup', updatePreview);
        editor.addEventListener('keyup', updatePreview);
      }

      updatePreview();
      updateRowControls();
    }



    // do not delete las input row
    function updateRowControls() {
      const inputs = document.querySelectorAll("input[name='item']");
      const deleteButton = document.querySelector("button[onclick='deleteRow()']");
      const inputsPerRow = currentColumns;

      if (deleteButton) {
        deleteButton.disabled = inputs.length <= inputsPerRow;
      }
    }

    //text area editor
    function execCmd(command, value = null) {
      document.execCommand(command, false, value);
    }
    
    // Toggle visibility of all row checkboxes
    const toggleBtn = document.getElementById('toggleCheckboxesBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        checkboxesEnabled = !checkboxesEnabled;
        syncCheckboxVisibility();
      });
    } else {
      console.warn('Checkboxes button not found: #toggleCheckboxesBtn');
    }


    function syncCheckboxVisibility() {
      // Form-side cells
      document.querySelectorAll('.row-checkbox').forEach(cell => {
        cell.classList.toggle('hidden-checkbox', !checkboxesEnabled);
      });

      // Preview-side checkboxes
      document.querySelectorAll('.preview-check').forEach(cb => {
        cb.classList.toggle('hidden-checkbox', !checkboxesEnabled);
      });

      // ✅ Add/remove a class to control the grid template
      const previewList = document.getElementById('previewItems');
      if (previewList) {
        previewList.classList.toggle('checkboxes-on', checkboxesEnabled);
      }
    }

      // Toggle Note Area visibility
      const toggleNoteAreaBtn = document.getElementById('toggleNoteBoxBtn');
      toggleNoteAreaBtn.addEventListener('click', () => {
        const container = document.getElementById('richTextContainer');
        if (container.classList.contains('form-note-area')) {
          container.classList.remove('form-note-area');
        } else {
          container.classList.add('form-note-area');
        }
         // ✅ Only add event listener if not already attached
          editor.removeEventListener('keyup', updatePreview);
          editor.addEventListener('keyup', updatePreview);
      });


