document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadFooterBtn');
  const fileInput = document.getElementById('footerImageInput');
  const previewContainer = document.querySelector('.preview-container');

  // Create #footerPreview if it doesn't exist
  let footerPreview = document.getElementById('footerPreview');
  if (!footerPreview) {
    footerPreview = document.createElement('div');
    footerPreview.id = 'footerPreview';
    previewContainer.appendChild(footerPreview); // append at the bottom
  }

  // Load saved footer image from sessionStorage
  const savedFooter = sessionStorage.getItem('footerImage');
  if (savedFooter) {
    footerPreview.innerHTML = `
      <button class="remove-footer-btn" title="Remove Footer">&times;</button>
      <img src="${savedFooter}" alt="Footer Image" />
    `;
    const removeBtn = footerPreview.querySelector('.remove-footer-btn');
    removeBtn.addEventListener('click', () => {
      sessionStorage.removeItem('footerImage');
      footerPreview.innerHTML = '';
    });
  }

  // Clicking "Add Footer" opens file input
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // When file is selected
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const imageUrl = event.target.result;

      sessionStorage.setItem('footerImage', imageUrl);

      footerPreview.innerHTML = `
        <button class="remove-footer-btn" title="Remove Footer">&times;</button>
        <img src="${imageUrl}" alt="Footer Image" />
      `;

      const removeBtn = footerPreview.querySelector('.remove-footer-btn');
      removeBtn.addEventListener('click', () => {
        sessionStorage.removeItem('footerImage');
        footerPreview.innerHTML = '';
      });
    };

    reader.readAsDataURL(file);
  });
});

