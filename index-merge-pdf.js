const pdfFilesInput = document.getElementById("pdfFilesInput");
const dropZone = document.getElementById("dropZone");
const mergeBtn = document.getElementById("mergePdfBtn");
const downloadBtn = document.getElementById("downloadMergedPdf");
const statusText = document.getElementById("mergeStatus");
const selectedFilesList = document.getElementById("selectedFilesList");

let mergedUrl = null;
let selectedFiles = [];
let dragStartIndex = null;

function setStatus(msg) {
  if (statusText) {
    statusText.textContent = msg || "";
  }
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatPageCount(count) {
  if (!count || Number.isNaN(count)) return "Pages: —";
  return count === 1 ? "1 page" : `${count} pages`;
}

function resetDownloadLink() {
  if (mergedUrl) {
    URL.revokeObjectURL(mergedUrl);
    mergedUrl = null;
  }

  if (downloadBtn) {
    downloadBtn.href = "#";
    downloadBtn.style.display = "none";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return String(value).replaceAll('"', "&quot;");
}

function clearDropMarkers() {
  if (!selectedFilesList) return;

  selectedFilesList.querySelectorAll(".file-row").forEach((row) => {
    row.classList.remove("drop-target-top", "drop-target-bottom");
  });
}

async function getPdfPageCount(file) {
  try {
    if (typeof file.pageCount === "number") return file.pageCount;

    const bytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    file.pageCount = pdf.getPageCount();

    return file.pageCount;
  } catch (error) {
    console.error("Could not read page count for:", file.name, error);
    file.pageCount = null;
    return null;
  }
}

async function enrichFilesWithPageCounts(files) {
  await Promise.all(
    files.map(async (file) => {
      await getPdfPageCount(file);
    })
  );

  renderSelectedFiles();
}

function moveFile(fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= selectedFiles.length ||
    toIndex >= selectedFiles.length
  ) {
    return;
  }

  const [movedFile] = selectedFiles.splice(fromIndex, 1);
  selectedFiles.splice(toIndex, 0, movedFile);

  resetDownloadLink();
  renderSelectedFiles();

  if (selectedFiles.length >= 2) {
    setStatus(`${selectedFiles.length} PDF files selected. Order updated.`);
  }
}

function renderSelectedFiles() {
  if (!selectedFilesList) return;

  if (selectedFiles.length === 0) {
    selectedFilesList.innerHTML = `<div class="empty-files-msg">No PDF files selected yet.</div>`;
    return;
  }

  selectedFilesList.innerHTML = selectedFiles
    .map((file, index) => {
      return `
        <div class="file-row" draggable="true" data-index="${index}">
          <div class="file-left">
            <div class="file-icon" aria-hidden="true">📄</div>

            <div class="file-info">
              <div class="file-name">${escapeHtml(file.name)}</div>

              <div class="file-meta">
                <span class="file-badge">${formatFileSize(file.size)}</span>
                <span class="file-badge">${formatPageCount(file.pageCount)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="remove-file-btn"
            data-index="${index}"
            title="Remove file"
            aria-label="Remove ${escapeAttribute(file.name)}"
          >
            ×
          </button>
        </div>
      `;
    })
    .join("");

  const removeButtons = selectedFilesList.querySelectorAll(".remove-file-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      if (Number.isNaN(index)) return;

      selectedFiles.splice(index, 1);
      resetDownloadLink();
      renderSelectedFiles();

      if (selectedFiles.length === 0) {
        setStatus("");
      } else if (selectedFiles.length === 1) {
        setStatus("Select at least 2 PDF files.");
      } else {
        setStatus(`${selectedFiles.length} PDF files selected.`);
      }
    });
  });

  const fileRows = selectedFilesList.querySelectorAll(".file-row");
  fileRows.forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      dragStartIndex = Number(row.dataset.index);
      row.classList.add("dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(dragStartIndex));
      }
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      clearDropMarkers();
      dragStartIndex = null;
    });

    row.addEventListener("dragover", (event) => {
      event.preventDefault();

      const targetIndex = Number(row.dataset.index);
      if (Number.isNaN(targetIndex) || dragStartIndex === null || dragStartIndex === targetIndex) {
        clearDropMarkers();
        return;
      }

      const rect = row.getBoundingClientRect();
      const offsetY = event.clientY - rect.top;
      const isTopHalf = offsetY < rect.height / 2;

      clearDropMarkers();
      row.classList.add(isTopHalf ? "drop-target-top" : "drop-target-bottom");
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drop-target-top", "drop-target-bottom");
    });

    row.addEventListener("drop", (event) => {
      event.preventDefault();

      const targetIndex = Number(row.dataset.index);
      if (Number.isNaN(targetIndex) || dragStartIndex === null) return;

      const rect = row.getBoundingClientRect();
      const offsetY = event.clientY - rect.top;
      const isTopHalf = offsetY < rect.height / 2;

      let insertIndex = targetIndex;

      if (!isTopHalf) {
        insertIndex = targetIndex + 1;
      }

      const adjustedIndex =
        dragStartIndex < insertIndex ? insertIndex - 1 : insertIndex;

      clearDropMarkers();

      if (adjustedIndex >= selectedFiles.length) {
        const [movedFile] = selectedFiles.splice(dragStartIndex, 1);
        selectedFiles.push(movedFile);
        resetDownloadLink();
        renderSelectedFiles();

        if (selectedFiles.length >= 2) {
          setStatus(`${selectedFiles.length} PDF files selected. Order updated.`);
        }
        return;
      }

      moveFile(dragStartIndex, adjustedIndex);
    });
  });
}

function addFiles(fileList) {
  const incomingFiles = Array.from(fileList || []);
  if (incomingFiles.length === 0) return;

  let addedCount = 0;
  let skippedCount = 0;
  const newlyAddedFiles = [];

  incomingFiles.forEach((file) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      skippedCount += 1;
      return;
    }

    const alreadyExists = selectedFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (alreadyExists) {
      skippedCount += 1;
      return;
    }

    file.pageCount = null;
    selectedFiles.push(file);
    newlyAddedFiles.push(file);
    addedCount += 1;
  });

  resetDownloadLink();
  renderSelectedFiles();
  enrichFilesWithPageCounts(newlyAddedFiles);

  if (selectedFiles.length === 0) {
    setStatus("Only PDF files are allowed.");
    return;
  }

  if (selectedFiles.length === 1) {
    setStatus("Select at least 2 PDF files.");
    return;
  }

  if (skippedCount > 0 && addedCount > 0) {
    setStatus(`${selectedFiles.length} PDF files selected. Some files were skipped.`);
    return;
  }

  if (skippedCount > 0 && addedCount === 0) {
    setStatus("Some files were skipped. Only unique PDF files are allowed.");
    return;
  }

  setStatus(`${selectedFiles.length} PDF files selected.`);
}

async function mergePDFs() {
  try {
    if (selectedFiles.length < 2) {
      setStatus("Select at least 2 PDF files.");
      return;
    }

    resetDownloadLink();
    setStatus("Merging PDFs...");

    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of selectedFiles) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);

      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });

    mergedUrl = URL.createObjectURL(blob);

    if (downloadBtn) {
      downloadBtn.href = mergedUrl;
      downloadBtn.style.display = "inline-flex";
    }

    setStatus("Merged PDF ready.");
  } catch (err) {
    console.error("PDF merge error:", err);
    setStatus("Error merging PDFs.");
  }
}

if (pdfFilesInput) {
  pdfFilesInput.addEventListener("change", (event) => {
    addFiles(event.target.files);
    pdfFilesInput.value = "";
  });
}

if (dropZone) {
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    addFiles(event.dataTransfer?.files);
  });
}

if (mergeBtn) {
  mergeBtn.addEventListener("click", mergePDFs);
}

renderSelectedFiles();