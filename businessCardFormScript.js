(function () {
  const openBtn = document.getElementById("openCreateBusinessCardBtn");
  const panel = document.getElementById("businessCardPanel");
  const generateBtn = document.getElementById("generateBusinessCardBtn");
  const downloadBtn = document.getElementById("downloadBusinessCardBtn");
  const result = document.getElementById("businessCardResult");

  let lastImageUrl = "";

  if (!openBtn || !panel || !generateBtn || !downloadBtn || !result) return;

  function getData() {
    return {
      company: document.getElementById("bcCompany")?.value.trim() || "",
      name: document.getElementById("bcName")?.value.trim() || "",
      role: document.getElementById("bcRole")?.value.trim() || "",
      phone: document.getElementById("bcPhone")?.value.trim() || "",
      email: document.getElementById("bcEmail")?.value.trim() || "",
      address: document.getElementById("bcAddress")?.value.trim() || ""
    };
  }

  function createBusinessCardImage(data) {
    const canvas = document.createElement("canvas");
    canvas.width = 1050;
    canvas.height = 600;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f97316";
    ctx.fillRect(0, 0, 90, canvas.height);

    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    ctx.fillStyle = "#f97316";
    ctx.font = "bold 40px Arial";
    ctx.fillText(data.company, 140, 85);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 56px Arial";
    ctx.fillText(data.name, 140, 165);

    ctx.fillStyle = "#444444";
    ctx.font = "30px Arial";
    ctx.fillText(data.role, 140, 215);

    ctx.fillStyle = "#222222";
    ctx.font = "28px Arial";

    let y = 315;

    if (data.phone) {
      ctx.fillText("☎ " + data.phone, 140, y);
      y += 52;
    }

    if (data.email) {
      ctx.fillText("✉ " + data.email, 140, y);
      y += 52;
    }

    if (data.address) {
      ctx.fillText("📍 " + data.address, 140, y);
    }

    return canvas.toDataURL("image/png");
  }

  openBtn.addEventListener("click", function () {

    const vaultPanel = document.getElementById("vaultPanel");
    const createLoginPanel = document.getElementById("createLoginPanel");

    if (vaultPanel) {
        vaultPanel.style.display = "none";
    }

    if (createLoginPanel) {
        createLoginPanel.style.display = "none";
    }

    const isOpen = panel.style.display === "block";

    panel.style.display = isOpen ? "none" : "block";
  });

  generateBtn.addEventListener("click", function () {
    const data = getData();

    const filledCount = Object.values(data).filter(Boolean).length;

    if (filledCount < 3) {
      alert("Please fill at least 3 fields.");
      return;
    }

    lastImageUrl = createBusinessCardImage(data);

    result.innerHTML = `
      <img 
        src="${lastImageUrl}" 
        alt="Business Card"
        style="max-width:100%; border-radius:12px; box-shadow:0 4px 14px rgba(0,0,0,0.15);"
      >
    `;

    downloadBtn.style.display = "inline-block";
  });

  downloadBtn.addEventListener("click", function () {
    if (!lastImageUrl) return;

    const a = document.createElement("a");
    a.href = lastImageUrl;
    a.download = "business-card.png";
    a.click();
  });
})();