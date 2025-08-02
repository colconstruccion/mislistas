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

      for (let i = 1; i <= count; i++) {
        const label = document.createElement('label');
        label.textContent = `Item ${i}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'item';
        input.className = 'list-item';
        input.placeholder = 'Enter list item';
        input.addEventListener('input', updatePreview);

        if (columns === 2) {
          let lastRow = itemsContainer.lastElementChild;
          if (!lastRow || lastRow.childElementCount >= 2) {
            lastRow = document.createElement('div');
            lastRow.className = 'inputs-row';
            itemsContainer.appendChild(lastRow);
          }
          const wrapper = document.createElement('div');
          wrapper.style.flex = '1';
          wrapper.appendChild(label);
          wrapper.appendChild(input);
          lastRow.appendChild(wrapper);
        } else {
          itemsContainer.appendChild(label);
          itemsContainer.appendChild(input);
        }
      }

      updatePreview();
    }

    function updatePreview() {
      previewTitle.textContent = titleInput.value.trim() || 'Your list title...';
      previewItems.innerHTML = '';
      const allItems = Array.from(document.querySelectorAll("input[name='item']"));

      if (currentColumns === 2) {
        for (let i = 0; i < allItems.length; i += 2) {
          const row = document.createElement('li');
          row.className = 'preview-row';

          const col1 = document.createElement('div');
          const col2 = document.createElement('div');

          col1.textContent = allItems[i]?.value.trim() || '...';
          col2.textContent = allItems[i + 1]?.value.trim() || '...';

          row.appendChild(col1);
          row.appendChild(col2);
          previewItems.appendChild(row);
        }
      } else {
        allItems.forEach(input => {
          const li = document.createElement('li');
          li.textContent = input.value.trim() || '...';
          previewItems.appendChild(li);
        });
      }
      // ✅ Update note preview if textarea exists
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



    // Initialize default list
    createItemInputs(5);
    //Create form
    function appendFlexibleNoteArea() {
        const noteWrapper = document.createElement('div');
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