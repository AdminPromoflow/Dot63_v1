// messages.js

class MessagesSection {
  constructor() {
    this.form = document.getElementById("msg-form-promoflow");
    this.input = document.getElementById("msg-input-promoflow");
    this.previewBody = document.getElementById("msg-preview-body");
    this.sendButton = document.getElementById("send_promoflow");
    this.caseTitle = document.getElementById("selected-case-title");
    this.caseSubtitle = document.getElementById("selected-case-subtitle");
    this.isSending = false;

    this.init();
  }

  init() {
    this.listenFormSubmit();
    this.listenInputKeydown();

    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("case");

    if (!caseId) {
      this.showNoCaseSelected();
    }
  }

  showNoCaseSelected() {
    if (this.caseTitle) {
      this.caseTitle.textContent = "No case selected";
    }

    if (this.caseSubtitle) {
      this.caseSubtitle.textContent = "Select a case to view the conversation.";
    }

    if (this.previewBody) {
      this.previewBody.classList.add("msg-preview-body-empty");
      this.previewBody.innerHTML = `<p class="msg-empty">Select a case to view the conversation.</p>`;
    }

    this.disableMessageForm();
  }

  setSelectedCaseHeader(caseName) {
    if (this.caseTitle) {
      this.caseTitle.textContent = caseName || "Selected case";
    }

    if (this.caseSubtitle) {
      this.caseSubtitle.textContent = "Live conversation";
    }
  }

  enableMessageForm() {
    if (this.form) {
      this.form.classList.remove("is-disabled");
    }

    if (this.input) {
      this.input.disabled = false;
      this.input.placeholder = "Write a message…";
    }

    if (this.sendButton) {
      this.sendButton.disabled = false;
    }
  }

  disableMessageForm() {
    if (this.form) {
      this.form.classList.add("is-disabled");
    }

    if (this.input) {
      this.input.disabled = true;
      this.input.placeholder = "Select a case before writing a message…";
    }

    if (this.sendButton) {
      this.sendButton.disabled = true;
    }
  }

  listenFormSubmit() {
    if (!this.form || this.form.dataset.bound === "1") return;

    this.form.dataset.bound = "1";

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessage();
    });
  }

  listenInputKeydown() {
    if (!this.input || this.input.dataset.keydownBound === "1") return;

    this.input.dataset.keydownBound = "1";

    this.input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (event.shiftKey) return;
      if (event.isComposing) return;

      event.preventDefault();

      if (this.form) {
        this.form.requestSubmit();
      } else {
        this.sendMessage();
      }
    });
  }

  async sendMessage() {
    if (!this.input || this.isSending) return false;

    const message = this.input.value.trim();

    if (!message) {
      this.input.value = "";
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("case");

    if (!caseId) {
      alert("Please select a case first.");
      return false;
    }

    const data = {
      action: "send_message",
      caseId: caseId,
      message: message
    };

    const url = "../../controller/promoflow/requests_Promoflow_api.php";

    /*
     * Clear the field immediately after pressing Enter
     * or clicking the send button.
     */
    this.input.value = "";
    this.resizeInput();
    this.input.focus();

    /*
     * Draw the message immediately so the interface
     * feels responsive.
     */
    const temporaryMessage = this.addMessageToView(message, "mine", true);

    this.setSendingState(true);

    const response = await this.makeRequest(url, data);

    this.setSendingState(false);

    if (!response) {
      temporaryMessage?.remove();
      this.restoreMessage(message);
      return false;
    }

    if (response.response === false || response.success === false) {
      temporaryMessage?.remove();
      this.restoreMessage(message);
      alert(response.message || "Unable to send message.");
      return false;
    }

    temporaryMessage?.classList.remove("is-sending");
    temporaryMessage?.removeAttribute("aria-busy");

    return true;
  }

  setSendingState(isSending) {
    this.isSending = Boolean(isSending);

    if (this.sendButton) {
      this.sendButton.disabled = this.isSending;
      this.sendButton.classList.toggle("is-sending", this.isSending);
      this.sendButton.setAttribute("aria-busy", this.isSending ? "true" : "false");
    }
  }

  restoreMessage(message) {
    if (!this.input) return false;

    if (!this.input.value.trim()) {
      this.input.value = message;
      this.resizeInput();
    }

    this.input.focus();

    return true;
  }

  resizeInput() {
    if (!(this.input instanceof HTMLTextAreaElement)) return false;

    this.input.style.height = "auto";
    this.input.style.height = `${this.input.scrollHeight}px`;

    return true;
  }

  async makeRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  addMessageToView(message, type = "mine", isTemporary = false) {
    if (!this.previewBody) return null;

    this.previewBody.classList.remove("msg-preview-body-empty");

    const emptyMessage = this.previewBody.querySelector(".msg-empty");

    if (emptyMessage) {
      emptyMessage.remove();
    }

    const row = document.createElement("div");
    const bubble = document.createElement("div");
    const text = document.createElement("p");

    row.classList.add("msg-row", type === "mine" ? "is-mine" : "is-other");
    bubble.classList.add("msg-bubble");
    text.classList.add("msg-bubble-text");

    if (isTemporary) {
      row.classList.add("is-sending");
      row.setAttribute("aria-busy", "true");
    }

    text.textContent = String(message ?? "");

    bubble.appendChild(text);
    row.appendChild(bubble);

    this.previewBody.appendChild(row);
    this.scrollToBottom();

    return row;
  }

  drawMessages(messages) {
    if (!this.previewBody) return false;

    this.previewBody.classList.remove("msg-preview-body-empty");
    this.previewBody.replaceChildren();

    if (!Array.isArray(messages) || messages.length === 0) {
      this.previewBody.classList.add("msg-preview-body-empty");
      this.previewBody.innerHTML = `<p class="msg-empty">No messages yet.</p>`;
      return false;
    }

    messages.forEach((messageItem) => {
      const type = messageItem?.sender_type === "supplier" ? "mine" : "other";
      const message = String(messageItem?.message ?? "").trim();

      if (message) {
        this.addMessageToView(message, type);
      }
    });

    this.scrollToBottom();

    return true;
  }

  scrollToBottom() {
    if (!this.previewBody) return false;

    this.previewBody.scrollTop = this.previewBody.scrollHeight;

    return true;
  }
}

class CreateCaseModal {
  constructor(messagesSection) {
    this.messagesSection = messagesSection;

    this.modal = document.getElementById("create-case-modal");
    this.openButton = document.getElementById("open-create-case");
    this.closeButton = document.getElementById("close-create-case");
    this.cancelButton = document.getElementById("cancel-create-case");
    this.form = document.getElementById("create-case-form");
    this.caseNameInput = document.getElementById("case-name");
    this.supplierSelect = document.getElementById("case-supplier");
    this.groupCases = document.getElementById("group_cases");

    this.refreshInterval = null;
    this.isRefreshing = false;

    this.init();

    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("case");

    if (caseId) {
      this.readCasesAndMessages();
      this.startMessagesRefresh();
    } else {
      this.readCases();
    }
  }

  init() {
    this.openButton?.addEventListener("click", () => {
      this.openModal();
    });

    this.closeButton?.addEventListener("click", () => {
      this.closeModal();
    });

    this.cancelButton?.addEventListener("click", () => {
      this.closeModal();
    });

    this.modal?.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.closeModal();
      }
    });

    this.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      this.createCase();
    });
  }

  startMessagesRefresh() {
    this.stopMessagesRefresh();

    this.refreshInterval = window.setInterval(() => {
      this.readCasesAndMessages();
    }, 3000);
  }

  stopMessagesRefresh() {
    if (!this.refreshInterval) return false;

    window.clearInterval(this.refreshInterval);
    this.refreshInterval = null;

    return true;
  }

  async readCasesAndMessages() {
    if (this.isRefreshing) return false;

    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("case");

    if (!caseId) {
      this.messagesSection.showNoCaseSelected();
      return false;
    }

    this.isRefreshing = true;

    const data = {
      action: "get_cases_and_messages",
      caseId: caseId
    };

    const url = "../../controller/promoflow/requests_Promoflow_api.php";
    const response = await this.makeRequest(url, data);

    this.isRefreshing = false;

    if (!response) return false;

    if (response.response === true) {
      const cases = Array.isArray(response.cases)
        ? response.cases
        : Array.isArray(response.result?.cases)
          ? response.result.cases
          : [];

      if (cases.length > 0) {
        this.drawCases(cases);
      }

      this.renderSelectedCase(response, caseId);
      return true;
    }

    alert(response.message || "Unable to load case.");
    this.messagesSection.showNoCaseSelected();

    return false;
  }

  renderSelectedCase(response, caseId) {
    const selectedCase =
      response?.case ??
      response?.result?.case ??
      null;

    if (selectedCase?.name) {
      this.messagesSection.setSelectedCaseHeader(selectedCase.name);
    } else {
      const activeCase = document.getElementById(`case_${caseId}`);
      const activeCaseName = activeCase
        ?.querySelector(".msg-folder-name")
        ?.textContent
        ?.trim();

      this.messagesSection.setSelectedCaseHeader(activeCaseName || `Case #${caseId}`);
    }

    this.messagesSection.enableMessageForm();
    this.setActiveCase(caseId);

    const messages = Array.isArray(response.messages)
      ? response.messages
      : Array.isArray(response.result?.messages)
        ? response.result.messages
        : Array.isArray(response.result)
          ? response.result
          : [];

    this.messagesSection.drawMessages(messages);
  }

  async readCases() {
    const data = {
      action: "get_cases"
    };

    const url = "../../controller/promoflow/requests_Promoflow_api.php";
    const response = await this.makeRequest(url, data);

    if (!response) return false;

    if (response.response === true) {
      const cases = Array.isArray(response.result)
        ? response.result
        : Array.isArray(response.cases)
          ? response.cases
          : [];

      this.drawCases(cases);
    }

    this.messagesSection.showNoCaseSelected();

    return true;
  }

  drawCases(result) {
    if (!this.groupCases) return false;

    this.groupCases.replaceChildren();

    const params = new URLSearchParams(window.location.search);
    const currentCaseId = params.get("case");

    if (!Array.isArray(result) || result.length === 0) {
      this.groupCases.innerHTML = `<p class="msg-empty">No cases yet.</p>`;
      return false;
    }

    result.forEach((caseItem) => {
      const idCase = String(caseItem?.id_case ?? "").trim();

      if (!idCase) return;

      const button = document.createElement("button");
      const dot = document.createElement("span");
      const name = document.createElement("span");

      button.id = `case_${idCase}`;
      button.className = "msg-folder";
      button.type = "button";
      button.dataset.caseId = idCase;

      if (currentCaseId === idCase) {
        button.classList.add("is-active");
        button.setAttribute("aria-current", "page");
      }

      dot.className = "msg-folder-dot";
      dot.setAttribute("aria-hidden", "true");

      name.className = "msg-folder-name";
      name.textContent = caseItem?.name || `Case #${idCase}`;

      button.appendChild(dot);
      button.appendChild(name);

      button.addEventListener("click", () => {
        this.handleCaseClick(idCase);
      });

      this.groupCases.appendChild(button);
    });

    return true;
  }

  handleCaseClick(caseId) {
    this.setActiveCase(caseId);

    const url = new URL(window.location.href);
    url.searchParams.set("case", caseId);

    window.location.href = url.toString();
  }

  setActiveCase(caseId) {
    const allFolders = document.querySelectorAll(".msg-folder");

    allFolders.forEach((folder) => {
      folder.classList.remove("is-active");
      folder.removeAttribute("aria-current");
    });

    const activeFolder = document.getElementById(`case_${caseId}`);

    if (activeFolder) {
      activeFolder.classList.add("is-active");
      activeFolder.setAttribute("aria-current", "page");
    }
  }

  async openModal() {
    if (!this.modal) return false;

    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/promoflow/requests_Promoflow_api.php";

    const data = {
      action: "get_suppliers",
      sku: sku
    };

    const response = await this.makeRequest(url, data);

    if (!response) return false;

    this.drawSuppliersCreateCase(response);

    this.modal.hidden = false;
    this.caseNameInput?.focus();

    return true;
  }

  drawSuppliersCreateCase(response) {
    if (!this.supplierSelect) return false;

    this.supplierSelect.replaceChildren();

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select supplier";

    this.supplierSelect.appendChild(defaultOption);

    if (!response || response.response !== true || !Array.isArray(response.result)) {
      return false;
    }

    response.result.forEach((supplier) => {
      const option = document.createElement("option");

      option.value = String(supplier?.supplier_id ?? "");
      option.textContent = `${supplier?.contact_name ?? ""} - ${supplier?.email ?? ""}`;

      this.supplierSelect.appendChild(option);
    });

    return true;
  }

  closeModal() {
    if (!this.modal) return false;

    this.modal.hidden = true;

    return true;
  }

  async createCase() {
    if (!this.caseNameInput || !this.supplierSelect || !this.form) return false;

    const caseName = this.caseNameInput.value.trim();
    const supplierId = this.supplierSelect.value;

    if (!caseName || !supplierId) {
      alert("Please complete all fields.");
      return false;
    }

    const url = "../../controller/promoflow/requests_Promoflow_api.php";

    const data = {
      action: "create_case",
      caseName: caseName,
      supplierId: supplierId
    };

    const response = await this.makeRequest(url, data);

    if (!response) return false;

    if (response.response === true) {
      alert(response.message || "Case created successfully.");

      this.form.reset();
      this.closeModal();

      if (response.id_case) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("case", response.id_case);
        window.location.href = currentUrl.toString();
        return true;
      }

      this.readCases();
      return true;
    }

    alert(response.message || "Unable to create case.");

    return false;
  }

  async makeRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);

      return null;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const messagesSection = new MessagesSection();

  window.messagesSection = messagesSection;
  window.createCaseModal = new CreateCaseModal(messagesSection);
});
