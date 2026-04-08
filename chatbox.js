document.addEventListener("DOMContentLoaded", () => {

  const openChatBoxBtn = document.getElementById("openChatBoxBtn");
  const closeChatBoxBtn = document.getElementById("closeChatBoxBtn");
  const chatBoxPanel = document.getElementById("chatBoxPanel");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const faqChips = document.querySelectorAll(".faq-chip");

  function appendMessage(text, sender = "bot") {
    const msg = document.createElement("div");
    msg.className =
      sender === "user"
        ? "bg-blue-600 text-white rounded-2xl px-4 py-3 text-sm max-w-[85%] ml-auto"
        : "bg-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-sm max-w-[85%]";
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getFaqAnswer(question) {
    const q = question.trim().toLowerCase();

    if (q.includes("what is lysty")) {
      return "Lysty is a platform to share PDFs and Word documents with a secure link or 4-digit code, without filling up other people’s devices.";
    }

    if (q.includes("share a document") || q.includes("how do i share")) {
      return "Upload your document, make it visible, and share the generated link or code with the other person.";
    }

    if (q.includes("need login") || q.includes("do i need login") || q.includes("open a shared document")) {
      return "No. People can open a shared document using the link or code without logging in.";
    }

    if (q.includes("how much") || q.includes("cost") || q.includes("price") || q.includes("pricing")) {
      return "The first 10 lists and first 10 documents are free. After that, it is $1 per additional list or document.";
    }

    if (q.includes("merge pdf") || q.includes("merge pdfs") || q.includes("how do i merge")) {
      return "Use the Merge PDF feature to combine multiple PDF files into one document directly on Lysty.";
    }

    if (q.includes("search") || q.includes("code")) {
      return "Type the shared document code into the search box on the homepage and click Search.";
    }

    return "I can help with simple questions about document sharing, pricing, login, search by code, and merging PDFs.";
  }

  function sendChatMessage(questionText) {
    const text = questionText.trim();
    if (!text) return;

    appendMessage(text, "user");

    const answer = getFaqAnswer(text);

    setTimeout(() => {
      appendMessage(answer, "bot");
    }, 250);
  }

  openChatBoxBtn?.addEventListener("click", () => {
    chatBoxPanel.classList.remove("hidden");
    chatInput?.focus();
  });

  closeChatBoxBtn?.addEventListener("click", () => {
    chatBoxPanel.classList.add("hidden");
  });

  sendChatBtn?.addEventListener("click", () => {
    const text = chatInput.value;
    sendChatMessage(text);
    chatInput.value = "";
  });

  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const text = chatInput.value;
      sendChatMessage(text);
      chatInput.value = "";
    }
  });

  faqChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      sendChatMessage(chip.textContent || "");
    });
  });

});