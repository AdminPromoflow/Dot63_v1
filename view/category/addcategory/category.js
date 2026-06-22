class ClassCategory {
  constructor() {

    const edit_categories = document.getElementById("edit_categories");
    const cancel_editing = document.getElementById("cancel_editing");
    const next_category = document.getElementById("next_category");

    next_category.addEventListener("click", function(){
      headerAddProduct.goNext('../../view/group/index.php');
    })

    edit_categories.addEventListener("click", function(){
      classCategory.editCategories();
    })

    cancel_editing.addEventListener("click", function(){
      classCategory.cancelCategoryEdit();
    })

    document.addEventListener('DOMContentLoaded', () => {
     headerAddProduct.setCurrentHeader('category');
   });
    this.getCategories();
  }

  async cancelCategoryEdit() {
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

  }

  async editCategories() {
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

  }

  async getCategories() {
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
        throw new Error("Network error.");
      }

      return await response.json();

    } catch (error) {
      console.error("Error:", error);
      alert(
      "Connection error.\n\n" +
      "The page will be refreshed automatically in a few seconds."

    );
      return null;
    }
  }

  getCategorySelected(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');


    const url = "../../controller/products/category.php";
    const data = {
      action: "get_category_selected",
      sku: sku
    };
    // Make a fetch request to the given URL with the specified data.
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        // Check if the response is okay, if so, return the response text.
        if (response.ok) {
          return response.text();
        }
        // If the response is not okay, throw an error.
        throw new Error("Network error.");
      })
      .then(data => {
        // alert(data);
        var data = JSON.parse(data);

        if (data["success"]) {


          const params = new URLSearchParams(window.location.search);
          const mode = params.get("mode");

            const id = Number.parseInt(data["data"][0]["category_id"], 10);
            if (!Number.isNaN(id)) classCategory.drawBorderCategory(id);



      }
      })
      .catch(error => {
        // Log any errors to the console.
        console.error("Error:", error);
      });
  //  alert(sku);
  }

  updatedCategory(goNext = false){
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
    // Make a fetch request to the given URL with the specified data.
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        // Check if the response is okay, if so, return the response text.
        if (response.ok) {
          return response.text();
        }
        // If the response is not okay, throw an error.
        throw new Error("Network error.");
      })
      .then(data => {
      //  alert(data);
        var data = JSON.parse(data);
        if (data["success"]) {
          if (goNext) {
            headerAddProduct.goNext('../../view/group/index.php');
          }
        }
        else {
          alert("Error saving category");
        }

      })
      .catch(error => {
        // Log any errors to the console.
        console.error("Error:", error);
      });

  }

  drawListCategories(data){
    if (!window.category_list) return;

    // 1) Limpiar
    category_list.innerHTML = "";

    // 2) Arreglo de categorías
    var list = (data && data.success && Array.isArray(data.data)) ? data.data : [];

    // 3) Pintar y asignar onclick con el índice
    for (var i = 0; i < list.length; i++) {
      var name  = list[i].name || "";
      var count = Number(list[i].products_count) || 0;
      var id = list[i].category_id;

      category_list.innerHTML +=
        '<div class="cp-cat" role="listitem" id="' + id + '" onclick="classCategory.selectCategory(' + id + ')">' +
          '<span class="cp-cat-name">' + name + '</span>' +
          '<small class="cp-cat-meta">' + count + ' products</small>' +
        '</div>';
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

  drawBorderCategory(divId){
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


}

// const btn_create_new_category = document.getElementById("btn-create-new-category");
// const new_category = document.getElementById("new_category");
// const next_category = document.getElementById("next_category");
const category_list = document.getElementById("category_list");
const classCategory = new ClassCategory();
