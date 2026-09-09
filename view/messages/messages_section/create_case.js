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
    {
      this.openButton?.addEventListener("click", () => {
        this.openModal();
      });
      this.closeButton?.addEventListener("click", () => {
        this.closeModal();
      });
      this.cancelButton?.addEventListener("click", () => {
        this.closeModal();
      });
      this.modal?.addEventListener("click", event => this.handleModalClick(event));
      this.form?.addEventListener("submit", event => this.handleFormSubmit(event));
    }
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("case");
    if (caseId) {
      this.readCasesAndMessages();
      this.startMessagesRefresh();
    } else {
      this.readCases();
    }
    this.groupCases?.addEventListener("click", event => this.selectCase(event));
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
    try {
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
        const cases = Array.isArray(response.cases) ? response.cases : Array.isArray(response.result?.cases) ? response.result.cases : [];
        if (cases.length > 0) {
          this.drawCases(cases);
        }
        this.renderSelectedCase(response, caseId);
        return true;
      }
      alert(response.message || "Unable to load case.");
      this.messagesSection.showNoCaseSelected();
      return false;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  renderSelectedCase(response, caseId) {
    const selectedCase = response?.case ?? response?.result?.case ?? null;
    if (selectedCase?.name) {
      this.messagesSection.setSelectedCaseHeader(selectedCase.name);
    } else {
      const activeCase = document.getElementById(`case_${caseId}`);
      const activeCaseName = activeCase?.querySelector(".msg-folder-name")?.textContent?.trim();
      this.messagesSection.setSelectedCaseHeader(activeCaseName || `Case #${caseId}`);
    }
    this.messagesSection.enableMessageForm();
    this.setActiveCase(caseId);
    const messages = Array.isArray(response.messages) ? response.messages : Array.isArray(response.result?.messages) ? response.result.messages : Array.isArray(response.result) ? response.result : [];
    this.messagesSection.drawMessages(messages);
  }

  async readCases() {
    try {
      const data = {
        action: "get_cases"
      };
      const url = "../../controller/promoflow/requests_Promoflow_api.php";
      const response = await this.makeRequest(url, data);
      if (!response) return false;
      if (response.response === true) {
        const cases = Array.isArray(response.result) ? response.result : Array.isArray(response.cases) ? response.cases : [];
        this.drawCases(cases);
      }
      this.messagesSection.showNoCaseSelected();
      return true;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
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
    result.forEach(caseItem => {
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
    allFolders.forEach(folder => {
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
    try {
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
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
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
    response.result.forEach(supplier => {
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
    try {
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
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  selectCase(event) {
    const button = event.target.closest("button[data-case-id]");
    if (!button || !this.groupCases.contains(button)) return;
    this.handleCaseClick(button.dataset.caseId);
  }

  handleModalClick(event) {
    if (event.target === this.modal) {
      this.closeModal();
    }
  }

  handleFormSubmit(event) {
    event.preventDefault();
    this.createCase();
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
