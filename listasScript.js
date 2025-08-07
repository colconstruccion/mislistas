    let sessionId = sessionStorage.getItem("sessionId") || crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);

    let currentColumns = 1;

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
        updatePreview();
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

    function createItemInputs(count, columns = 1) {
      itemsContainer.innerHTML = '';
      currentColumns = columns;

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
          // Single-column layout
          itemsContainer.appendChild(label);
          itemsContainer.appendChild(input);

        } else {
          // Start a new row every N items
          if ((i - 1) % columns === 0) {
            row = document.createElement('div');
            row.className = 'inputs-row';
            itemsContainer.appendChild(row);
          }

          const wrapper = document.createElement('div');
          wrapper.appendChild(label);
          wrapper.appendChild(input);

          // Adjust column widths
          if (columns === 2) {
            wrapper.style.flex = '1';
          } else if (columns === 3) {
            if ((i - 1) % 3 === 0) {
              wrapper.style.flex = '2'; // first input of row (½ row)
            } else {
              wrapper.style.flex = '1'; // second and third input (¼ each)
            }
          }

          row.appendChild(wrapper);
        }
      }

      updatePreview(); 
      updateRowControls(); 
    }


    function updatePreview() {
      previewTitle.textContent = titleInput.value.trim() || 'Your list title...';
      previewItems.innerHTML = '';
      const allItems = Array.from(document.querySelectorAll("input[name='item']"));

      if (currentColumns === 2 || currentColumns === 3) {
        for (let i = 0; i < allItems.length; i += currentColumns) {
          const row = document.createElement('li');
          row.className = 'preview-row';
          row.classList.add(`col-${currentColumns}`);

          for (let j = 0; j < currentColumns; j++) {
            const col = document.createElement('div');
            col.textContent = allItems[i + j]?.value.trim() || '...';
            row.appendChild(col);
          }

          previewItems.appendChild(row);
        }
      } else {
        // Single-column layout
        allItems.forEach(input => {
          const li = document.createElement('li');
          li.textContent = input.value.trim() || '...';
          previewItems.appendChild(li);
        });
      }

      // ✅ Show note content if present
      const noteTextarea = document.getElementById('form-note');
      const notePreview = document.getElementById('notePreview');
      if (noteTextarea && notePreview) {
        notePreview.textContent = noteTextarea.value.trim();
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

    // para formularios
    document.querySelectorAll(".sidebar a.form-option").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const rows = parseInt(this.dataset.rows, 10);
            createItemInputs(rows, 1); // one-column inputs
            appendFlexibleNoteArea(); // add flexible textarea
        });
    });

    document.querySelectorAll(".sidebar a.form2-option").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const rows = parseInt(this.dataset.rows, 10);
        const totalInputs = rows * 2; // Two columns per row
        createItemInputs(totalInputs, 2);
        appendFlexibleNoteArea();
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

    document.querySelectorAll(".sidebar a.form3-option").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const rows = parseInt(this.dataset.rows, 10);
        const totalInputs = rows * 3;
        createItemInputs(totalInputs, 3);
        appendFlexibleNoteArea();
      });
    });


    // Initialize default list
    createItemInputs(5);
    //Create form
    function appendFlexibleNoteArea() {
      const noteWrapper = document.createElement('div');
      noteWrapper.className = 'form-note-area'; // 🔁 Add class for detection
      noteWrapper.style.marginTop = '20px';

      const noteLabel = document.createElement('label');
      noteLabel.textContent = "Notes";
      noteLabel.setAttribute('for', 'form-note');

      const textarea = document.createElement('textarea');
      textarea.id = 'form-note';
      textarea.style.width = '100%';
      textarea.style.minHeight = '100px';
      textarea.style.padding = '10px';
      textarea.style.fontSize = '16px';
      textarea.style.border = '1px solid #ccc';
      textarea.style.borderRadius = '6px';
      textarea.style.backgroundColor = '#fafafa';
      textarea.addEventListener('input', updatePreview);

      noteWrapper.appendChild(noteLabel);
      noteWrapper.appendChild(textarea);
      itemsContainer.appendChild(noteWrapper);
    }


    // Add rows
    function addRow() {
      const inputsPerRow = currentColumns;
      const currentInputs = Array.from(document.querySelectorAll("input[name='item']"));
      const newTotal = currentInputs.length + inputsPerRow;

      const existingValues = currentInputs.map(input => input.value.trim());

      // ✅ Detect if a form note area exists
      const noteElement = document.querySelector('.form-note-area');
      const noteContent = document.getElementById('form-note')?.value.trim() || "";

      createItemInputs(newTotal, currentColumns);

      const allInputs = document.querySelectorAll("input[name='item']");
      existingValues.forEach((val, i) => allInputs[i].value = val);

      // ✅ Re-append note if it existed
      if (noteElement) {
        appendFlexibleNoteArea();
        document.getElementById('form-note').value = noteContent;
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

      // ✅ Detect note before regeneration
      const noteElement = document.querySelector('.form-note-area');
      const noteContent = document.getElementById('form-note')?.value.trim() || "";

      createItemInputs(newTotal, currentColumns);

      const allInputs = document.querySelectorAll("input[name='item']");
      remainingValues.forEach((val, i) => allInputs[i].value = val);

      // ✅ Re-append note if it existed
      if (noteElement) {
        appendFlexibleNoteArea();
        document.getElementById('form-note').value = noteContent;
      }

      updatePreview();
      updateRowControls();
    }
    

    //checks if this is a form to add the text area after adding or deleting row
    function isFormMode() {
      return (
        document.querySelector(".sidebar a.form-option.active") ||
        document.querySelector(".sidebar a.form2-option.active") ||
        document.querySelector(".sidebar a.form3-option.active")
      );
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

