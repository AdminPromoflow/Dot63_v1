class ClassGroup {
  constructor() {

    document.addEventListener('DOMContentLoaded', () => {
      headerAddProduct.setCurrentHeader('group');
    });

    this.group_selected = "";

    // (Opcional) Si luego reactivas crear grupo, ya queda listo:
    // btn_create_new_group.addEventListener("click", () => {
    //   classGroup.createNewGroup();
    // });

    next_group.addEventListener("click", () => {
      if (Number.isInteger(classGroup.group_selected)) {
        classGroup.updateGroup();
      } else {
        alert("Please select a group first.");
      }
    });

    this.getGroups();

    setTimeout(() => this.getGroupSelected(), 1000);
  }

  getGroupSelected(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');

    const url = "../../controller/products/group.php";
    const data = {
      action: "get_group_selected",
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(data => {
        const res = JSON.parse(data);

        if (res["success"]) {
          const id = Number.parseInt(res["group_id"], 10);
          if (!Number.isNaN(id)) classGroup.selectGroup(id);

          if (res["group_name"] === "Unassigned Group") {
            // alert("Please select a group first.");
          }
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  updateGroup(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');

    const url = "../../controller/products/product.php";
    const data = {
      action: "update_group",
      group_id: this.group_selected,
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(data => {
      //    alert(data);
        const res = JSON.parse(data);

        if (res["success"]) {
          // Siguiente paso después de Group (ajústalo a tu siguiente vista real)
          headerAddProduct.goNext('../../view/product_details/index.php');
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  getGroups(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');

    const url = "../../controller/products/group.php";
    const data = {
      action: "get_groups",
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(data => {
      //  alert(data);
        const res = JSON.parse(data);
        classGroup.drawListGroups(res);
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  drawListGroups(data){
    if (!window.group_list) return;

    // 1) Limpiar
    group_list.innerHTML = "";

    // 2) Arreglo de grupos
    const list = (data && data.success && Array.isArray(data.data)) ? data.data : [];

    // 3) Pintar (usa cp-group, cp-group-name, cp-group-meta, y contenedor group_list)
    for (let i = 0; i < list.length; i++) {
      const name  = list[i].name || "";
      const count = Number(list[i].products_count) || 0;

      // IMPORTANTE: aquí usas group_id (equivalente a category_id)
      const id = list[i].group_id;

      group_list.innerHTML +=
        '<div class="cp-group" role="listitem" id="' + id + '" onclick="classGroup.selectGroup(' + id + ')">' +
          '<span class="cp-group-name">' + name + '</span>' +
          '<small class="cp-group-meta">' + count + ' products</small>' +
        '</div>';
    }
  }

  selectGroup(divId) {
    if (!window.group_list) return;

    const boxes = group_list.querySelectorAll('.cp-group');

    // Limpiar bordes
    for (let j = 0; j < boxes.length; j++) {
      boxes[j].style.border = '2px solid var(--border)';
      boxes[j].style.borderRadius = '';
    }

    // Pintar borde del seleccionado
    const el = document.getElementById(divId);
    if (!el) return;

    el.style.border = '2px solid var(--brand, #005548)';
    el.style.borderRadius = '12px';

    // Guardar el ID seleccionado (NO índice)
    this.group_selected = divId;
  }
}

// Si en tu HTML tienes estos IDs (según el código que hicimos):
// btn-create-new-group, new_group, next_group, group_list
const btn_create_new_group = document.getElementById("btn-create-new-group");
const new_group            = document.getElementById("new_group");
const next_group           = document.getElementById("next_group");
const group_list           = document.getElementById("group_list");
const classGroup           = new ClassGroup();
