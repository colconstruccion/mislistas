document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadHeaderBtn');
  const fileInput = document.getElementById('headerImageInput');
  const previewContainer = document.querySelector('.preview-container');

  // Create the <div id="headerPreview"> if it doesn't exist
  let headerPreview = document.getElementById('headerPreview');
  if (!headerPreview) {
    headerPreview = document.createElement('div');
    headerPreview.id = 'headerPreview';
    previewContainer.insertBefore(headerPreview, previewContainer.firstChild);
  }

  // Load saved image from session on page load
  const savedImage = sessionStorage.getItem('headerImage');
  if (savedImage) {
    headerPreview.innerHTML = `<img src="${savedImage}" alt="Header Image" />`;
  }

  // Click on upload button triggers file input
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle image selection
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const imageUrl = event.target.result;

      // Save to session storage
      sessionStorage.setItem('headerImage', imageUrl);

      // Display in preview
      headerPreview.innerHTML = `<img src="${imageUrl}" alt="Header Image" />`;
    };
    reader.readAsDataURL(file);
  });
});
