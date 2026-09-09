class ClassCategory {
  constructor() {
    const edit_categories = document.getElementById("edit_categories");
    const cancel_editing = document.getElementById("cancel_editing");
    const next_category = document.getElementById("next_category");
    next_category.addEventListener("click", () => {
      headerAddProduct.goNext('../../view/group/index.php');
    });
    edit_categories.addEventListener("click", () => {
      this.editCategories();
    });
    cancel_editing.addEventListener("click", () => {
      this.cancelCategoryEdit();
    });
    document.addEventListener('DOMContentLoaded', () => {
      headerAddProduct.setCurrentHeader('category');
    });
    this.getCategories();
    document.addEventListener("click", event => this.handleListClick(event));
  }

  async cancelCategoryEdit() {
    try {
      const edit_categories = document.getElementById("edit_categories");
      const cancel_editing = document.getElementById("cancel_editing");
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const url = "../../controller/products/category.php";
      const data = {
        action: "get_categories",
        sku: sku
      };
      const response = await this.makeRequest(url, data);
      if (!response) return;
      edit_categories.style.display = "block";
      cancel_editing.style.display = "none";
      this.drawListCategories(response.category_selected);
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async editCategories() {
    try {
      const edit_categories = document.getElementById("edit_categories");
      const cancel_editing = document.getElementById("cancel_editing");
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const url = "../../controller/products/category.php";
      const data = {
        action: "get_categories",
        sku: sku
      };
      const response = await this.makeRequest(url, data);
      if (!response) return;
      edit_categories.style.display = "none";
      cancel_editing.style.display = "block";
      this.drawListCategories(response);
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async getCategories() {
    try {
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const url = "../../controller/products/category.php";
      const data = {
        action: "get_categories",
        sku: sku
      };
      const response = await this.makeRequest(url, data);
      if (!response) return;
      if (response.category_selected?.data?.[0]?.name === "Unassigned Category") {
        this.drawListCategories(response);
      } else {
        this.drawListCategories(response.category_selected);
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async getCategorySelected() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    const url = "../../controller/products/category.php";
    const data = {
      action: "get_category_selected",
      sku: sku
    };
    try {
      const response = await this.makeRequest(url, data);
      if (response["success"]) {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const id = Number.parseInt(response["data"][0]["category_id"], 10);
        if (!Number.isNaN(id)) this.drawBorderCategory(id);
      }
    } catch (error) {
      console.error("Error:", error);
    } //  alert(sku);
  }

  async updatedCategory(goNext = false) {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    // alert(email.value + password.value);
    // alert(email.value + password.value);
    const url = "../../controller/products/product.php";
    const data = {
      action: "update_category",
      id: this.category_selected,
      sku: sku
    };
    try {
      const response = await this.makeRequest(url, data);
      if (response["success"]) {
        if (goNext) {
          headerAddProduct.goNext('../../view/group/index.php');
        }
      } else {
        alert("Error saving category");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  drawListCategories(data) {
    if (!window.category_list) return;

    // 1) Limpiar
    category_list.innerHTML = "";

    // 2) Arreglo de categorías
    var list = data && data.success && Array.isArray(data.data) ? data.data : [];
    for (var i = 0; i < list.length; i++) {
      var name = list[i].name || "";
      var count = Number(list[i].products_count) || 0;
      var id = list[i].category_id;
      category_list.innerHTML += '<div class="cp-cat" role="listitem" id="' + id + '">' + '<span class="cp-cat-name">' + name + '</span>' + '<small class="cp-cat-meta">' + count + ' products</small>' + '</div>';
    }
    this.getCategorySelected();
  }

  selectCategory(divId) {
    if (!window.category_list) return;
    var boxes = category_list.querySelectorAll('.cp-cat');

    // Limpiar bordes
    for (var j = 0; j < boxes.length; j++) {
      boxes[j].style.border = '2px solid var(--border)';
      boxes[j].style.borderRadius = '';
    }

    // Pintar borde del seleccionado
    var el = document.getElementById(divId);
    if (!el) return;
    el.style.border = '2px solid var(--brand, #005548)';
    el.style.borderRadius = '12px';

    // Guardar el ID del div seleccionado
    this.category_selected = divId;
    this.updatedCategory(true);
  }

  drawBorderCategory(divId) {
    if (!window.category_list) return;
    var boxes = category_list.querySelectorAll('.cp-cat');

    // Limpiar bordes
    for (var j = 0; j < boxes.length; j++) {
      boxes[j].style.border = '2px solid var(--border)';
      boxes[j].style.borderRadius = '';
    }

    // Pintar borde del seleccionado
    var el = document.getElementById(divId);
    if (!el) return;
    el.style.border = '2px solid var(--brand, #005548)';
    el.style.borderRadius = '12px';

    // Guardar el ID del div seleccionado
    this.category_selected = divId;
  }

  handleListClick(event) {
    const item = event.target.closest("#category_list .cp-cat");
    if (item) this.selectCategory(Number(item.id));
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

// const btn_create_new_category = document.getElementById("btn-create-new-category");
// const new_category = document.getElementById("new_category");
// const next_category = document.getElementById("next_category");
const category_list = document.getElementById("category_list");
const classCategory = new ClassCategory();
