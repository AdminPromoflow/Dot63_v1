class ClassGroup {
  constructor() {
    const edit_groups = document.getElementById("edit_groups");
    const cancel_editing = document.getElementById("cancel_editing");
    const next_group = document.getElementById("next_group");

    edit_groups.addEventListener("click", function(){
      classGroup.editGroups();
    });

    cancel_editing.addEventListener("click", function(){
      classGroup.cancelGroupEdit();
    });

    next_group.addEventListener("click", function(){
      headerAddProduct.goNext("../../view/product_list/index.php");
    });

    document.addEventListener("DOMContentLoaded", () => {
      headerAddProduct.setCurrentHeader("group");
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

    this.drawListGroups(response);
  }

  async getGroups() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/group.php";

    const data = {
      action: "get_groups",
      sku: sku
    };

    const response = await this.makeRequest(url, data);

    if (!response) return;

    if (response.group_selected?.data?.[0]?.name === "Unassigned Group") {
      this.drawListGroups(response);
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

  getGroupSelected() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/group.php";

    const data = {
      action: "get_group_selected",
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
          if (!Number.isNaN(id)) classGroup.drawBorderGroup(id);
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  updateGroup(goNext = false) {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");

    const url = "../../controller/products/product.php";

    const data = {
      action: "update_group",
      group_id: this.group_selected,
      sku: sku
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response.text();
        throw new Error("Network error.");
      })
      .then(data => {
        const res = JSON.parse(data);

        if (res["success"]) {
          if (goNext) {
            headerAddProduct.goNext("../../view/product_list/index.php");
          }
        } else {
          alert("Error saving group");
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  drawListGroups(data) {
    if (!window.group_list) return;

    group_list.innerHTML = "";

    const list = data && data.success && Array.isArray(data.data)
      ? data.data
      : [];

    for (let i = 0; i < list.length; i++) {
      const name = list[i].name || "";
      const count = Number(list[i].products_count) || 0;
      const id = list[i].group_id;

      group_list.innerHTML +=
        '<div class="cp-group" role="listitem" id="' + id + '" onclick="classGroup.selectGroup(' + id + ')">' +
          '<span class="cp-group-name">' + name + '</span>' +
          '<small class="cp-group-meta">' + count + ' products</small>' +
        '</div>';
    }

    this.getGroupSelected();
  }

  selectGroup(divId) {
    if (!window.group_list) return;

    const boxes = group_list.querySelectorAll(".cp-group");

    for (let j = 0; j < boxes.length; j++) {
      boxes[j].style.border = "2px solid var(--border)";
      boxes[j].style.borderRadius = "";
    }

    const el = document.getElementById(divId);
    if (!el) return;

    el.style.border = "2px solid var(--brand, #005548)";
    el.style.borderRadius = "12px";

    this.group_selected = divId;
    this.updateGroup(true);
  }

  drawBorderGroup(divId) {
    if (!window.group_list) return;

    const boxes = group_list.querySelectorAll(".cp-group");

    for (let j = 0; j < boxes.length; j++) {
      boxes[j].style.border = "2px solid var(--border)";
      boxes[j].style.borderRadius = "";
    }

    const el = document.getElementById(divId);
    if (!el) return;

    el.style.border = "2px solid var(--brand, #005548)";
    el.style.borderRadius = "12px";

    this.group_selected = divId;
  }
}

const group_list = document.getElementById("group_list");
const classGroup = new ClassGroup();
