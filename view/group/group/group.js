class ClassGroup {
  constructor() {
    const btn_back_groups = document.getElementById("btn_back_groups");
    const edit_groups = document.getElementById("edit_groups");
    const cancel_editing = document.getElementById("cancel_editing");
    const next_group = document.getElementById("next_group");

    btn_back_groups.addEventListener("click", function(){
      headerAddProduct.goNext('../../view/category/index.php');
    });

    edit_groups.addEventListener("click", function(){
      classGroup.editGroups();
    });

    cancel_editing.addEventListener("click", function(){
      classGroup.cancelGroupEdit();
    });

    next_group.addEventListener("click", function(){
      headerAddProduct.goNext('../../view/product_list/index.php');
    });

    document.addEventListener('DOMContentLoaded', () => {
      headerAddProduct.setCurrentHeader('group');
    });

    this.group_selected = "";

    this.getGroups();
  }

  async cancelGroupEdit() {
    const edit_groups = document.getElementById("edit_groups");
    const cancel_editing = document.getElementById("cancel_editing");
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/group.php";

    const data = {
      action: "get_groups",
      sku: sku
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;

    edit_groups.style.display = "block";
    cancel_editing.style.display = "none";

    this.drawListGroups(response.group_selected);
  }

  async editGroups() {
    const edit_groups = document.getElementById("edit_groups");
    const cancel_editing = document.getElementById("cancel_editing");
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/group.php";

    const data = {
      action: "get_groups",
      sku: sku
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;

    edit_groups.style.display = "none";
    cancel_editing.style.display = "block";

    this.drawListGroups(response.data);
  }

  async getGroups(){
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');

    const url = "../../controller/products/group.php";
    const data = {
      action: "get_groups",
      sku: sku
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;

    alert(JSON.stringify(response));

    if (response.group_selected?.data?.[0]?.name === "Unassigned Group") {
      this.drawListGroups(response.data);
    } else {
      this.drawListGroups(response.group_selected);
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
      return null;
    }
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
          const id = Number.parseInt(res["data"][0]["group_id"], 10);
          if (!Number.isNaN(id)) classGroup.selectBorderGroup(id);

          if (res["group_name"] === "Unassigned Group") {
            // alert("Please select a group first.");
          }
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  updateGroup(goNext = false){
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
         // alert(data);
        const res = JSON.parse(data);

        if (res["success"]) {
          if (goNext) {
            headerAddProduct.goNext('../../view/product_list/index.php');
          }
        }
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
          // '<small class="cp-group-meta">' + count + ' products</small>' +
        '</div>';
    }
    this.getGroupSelected();
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
    this.updateGroup(true);
  }

  selectBorderGroup(divId){
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

class GroupArrows {
  constructor({
    wrapperSelector = '.cp-group-wrapper',
    scrollerSelector = '.cp-group-grid',
    upId = 'arrow_up_group',
    downId = 'arrow_down_group',
    step = 'ratio',
    stepPx = 200,
    stepRatio = 0.8
  } = {}) {
    this.wrapper = document.querySelector(wrapperSelector);
    this.scroller = document.querySelector(scrollerSelector);
    this.up = document.getElementById(upId);
    this.down = document.getElementById(downId);

    if (!this.wrapper || !this.scroller || (!this.up && !this.down)) return;

    this.step = step;
    this.stepPx = stepPx;
    this.stepRatio = stepRatio;

    this.update = this.update.bind(this);
    this.onUp = () => this.scroll(-1);
    this.onDown = () => this.scroll(1);

    this.up?.addEventListener('click', this.onUp);
    this.down?.addEventListener('click', this.onDown);
    this.scroller.addEventListener('scroll', this.update, { passive: true });
    addEventListener('resize', this.update);

    this.mo = new MutationObserver(() => this.update());
    this.mo.observe(this.scroller, { childList: true, subtree: true });

    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.update());
      this.ro.observe(this.scroller);
    }

    this.update();
  }

  getStep() {
    if (this.step === 'px') return this.stepPx;
    if (this.step === 'ratio') return this.scroller.clientHeight * this.stepRatio;
    return this.scroller.clientHeight; // 'page'
  }

  scroll(dir) {
    this.scroller.scrollBy({
      top: this.getStep() * dir,
      left: 0,
      behavior: 'smooth'
    });
  }

  update() {
    const el = this.scroller;
    const max = el.scrollHeight - el.clientHeight;
    const y = el.scrollTop;
    const margin = 6;

    if (this.up) this.up.style.display = y > margin ? 'flex' : 'none';
    if (this.down) this.down.style.display = y < max - margin ? 'flex' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GroupArrows();
});
