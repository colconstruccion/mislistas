const titleInput = document.getElementById('title');
    const itemsContainer = document.getElementById('itemsContainer');
    const previewTitle = document.getElementById('previewTitle');
    const previewItems = document.getElementById('previewItems');

    let currentColumns = 1; // Track column layout

    function updatePreview() {
        previewTitle.textContent = titleInput.value.trim() || 'Your list title...';
        previewItems.innerHTML = '';
        const allItems = Array.from(itemsContainer.querySelectorAll('input[name="item"]'));

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

    function toggleSection(id) {
        document.getElementById(id).classList.toggle('active');
    }

    titleInput.addEventListener('input', updatePreview);

    document.querySelectorAll('.sidebar a.option').forEach(link => {
        link.addEventListener('click', function (e) {
        e.preventDefault();
        const count = parseInt(this.dataset.count, 10);
        const columns = parseInt(this.dataset.columns, 10);
        const totalInputs = columns === 2 ? count * 2 : count;
        createItemInputs(totalInputs, columns);
        });
    });

    // Initial load: single-column 5 items
    createItemInputs(5);