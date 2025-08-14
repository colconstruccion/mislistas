document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadHeaderBtn');
  const fileInput = document.getElementById('headerImageInput');
  const previewContainer = document.querySelector('.preview-container');

  // Create the #headerPreview container if not already in the DOM
  let headerPreview = document.getElementById('headerPreview');
  if (!headerPreview) {
    headerPreview = document.createElement('div');
    headerPreview.id = 'headerPreview';
    previewContainer.insertBefore(headerPreview, previewContainer.firstChild);
  }

  // Load previously saved header image from sessionStorage
  const savedImage = sessionStorage.getItem('headerImage');
  if (savedImage) {
    headerPreview.innerHTML = `
      <button class="remove-btn" title="Remove Header">&times;</button>
      <img src="${savedImage}" alt="Header Image" />
    `;
    const removeBtn = headerPreview.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
      sessionStorage.removeItem('headerImage');
      headerPreview.innerHTML = '';
    });
  }

  // Clicking the upload button triggers the hidden file input
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection and preview
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const imageUrl = event.target.result;

      // Save image to sessionStorage
      sessionStorage.setItem('headerImage', imageUrl);

      // Display the image in the headerPreview div
      headerPreview.innerHTML = `
        <button class="remove-btn" title="Remove Header">&times;</button>
        <img src="${imageUrl}" alt="Header Image" />
      `;

      // Set up remove functionality
      const removeBtn = headerPreview.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        sessionStorage.removeItem('headerImage');
        headerPreview.innerHTML = '';
      });
    };

    reader.readAsDataURL(file);
  });
});

