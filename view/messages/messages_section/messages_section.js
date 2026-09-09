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
    {
      {
        if (!(!this.form || this.form.dataset.bound === "1")) {
          this.form.dataset.bound = "1";
          this.form.addEventListener("submit", event => this.handleFormSubmit(event));
        }
      }
      {
        if (!(!this.input || this.input.dataset.keydownBound === "1")) {
          this.input.dataset.keydownBound = "1";
          this.input.addEventListener("keydown", event => this.handleInputKeydown(event));
        }
      }
      const params = new URLSearchParams(window.location.search);
      const caseId = params.get("case");
      if (!caseId) {
        this.showNoCaseSelected();
      }
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

  async sendMessage() {
    try {
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
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
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
    messages.forEach(messageItem => {
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

  handleFormSubmit(event) {
    event.preventDefault();
    this.sendMessage();
  }

  handleInputKeydown(event) {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;
    if (event.isComposing) return;
    event.preventDefault();
    if (this.form) {
      this.form.requestSubmit();
    } else {
      this.sendMessage();
    }
  }

  async makeRequest(url, data, options = {}) {
    const {
      requireSuccess = false,
      responseType = "json",
      ...requestOptions
    } = options;
    const isFormData = data instanceof FormData;
    const headers = new Headers(requestOptions.headers || {});
    if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      ...requestOptions,
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    const text = await response.text();
    let result;
    try {
      result = responseType === "text" ? text : JSON.parse(text);
    } catch {
      const error = new Error("The server returned an invalid response.");
      error.status = response.status;
      throw error;
    }
    if (!response.ok || requireSuccess && !result?.success) {
      const error = new Error(result?.error || result?.message || "The request could not be completed.");
      error.status = response.status;
      error.code = result?.code || null;
      error.details = result;
      throw error;
    }
    return result;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const messagesSection = new MessagesSection();
  window.messagesSection = messagesSection;
  window.createCaseModal = new CreateCaseModal(messagesSection);
});
