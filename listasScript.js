    const titleInput = document.getElementById('title');
    const itemsContainer = document.getElementById('itemsContainer');
    const previewTitle = document.getElementById('previewTitle');
    const previewItems = document.getElementById('previewItems');
    const addItemBtn = document.getElementById('addItemBtn');

    // Add new item input
    let itemCount = 0;
    function addItemInput() {
      itemCount++;
      const label = document.createElement('label');
      label.textContent = `Item ${itemCount}`;
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'item';
      input.className = 'list-item';
      input.placeholder = 'Escriba el item de la lista';
      itemsContainer.appendChild(label);
      itemsContainer.appendChild(input);
      input.addEventListener('input', updatePreview);
    }

    // Create multiple item inputs
    function createItemInputs(count) {
      itemsContainer.innerHTML = '';
      itemCount = 0;
      for (let i = 0; i < count; i++) {
        addItemInput();
      }
      updatePreview();
    }

    // Update preview
    function updatePreview() {
      previewTitle.textContent = titleInput.value.trim() || 'Nombre de su lista...';
      previewItems.innerHTML = '';
      const allItems = itemsContainer.querySelectorAll('input[name="item"]');
      allItems.forEach(input => {
        const value = input.value.trim();
        const li = document.createElement('li');
        li.textContent = value || '...';
        previewItems.appendChild(li);
      });
    }

    // Event listeners
    titleInput.addEventListener('input', updatePreview);
    addItemBtn.addEventListener('click', () => {
      addItemInput();
      updatePreview();
    });

    // Sidebar link clicks
    document.querySelectorAll('.sidebar a[data-count]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const count = parseInt(link.getAttribute('data-count'), 10);
        createItemInputs(count);
      });
    });

    // Initial 1 item
    createItemInputs(1);