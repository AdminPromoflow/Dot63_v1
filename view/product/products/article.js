class ProductsClass {
  constructor() {
    this.productsData = [];
    this.searchInput = document.getElementById("product-search");

    this.categoryFilter = document.getElementById("category_filter");
    this.articles = document.getElementById("articles");

    this.fetchGetProducts();
    this.initSearch();
    this.getCategoryFilters();
    this.initPriceRange();


    document.addEventListener('change', function(event) {
      productsClass.getEventAllGroups();
      productsClass.getEventGroups();
    });
  }

  getEventGroups(){
    if (!event.target.classList.contains('groups')) {
      return;
    }
    this.getProductsByFilterGroups();
  }

  getEventAllGroups(){
    var group_category = '';

    if (!event.target.classList.contains('all_groups')) {
      return;
    }
    if (event.target.classList.contains('all_groups')) {
      const groups = document.querySelectorAll(".groups");

      groups.forEach(function(group) {
        group_category = group.value.split("-")[0];

        if (event.target.value == group_category) {
          if (event.target.checked == true) {
            group.checked = true;
          }
          else {
            group.checked = false;
          }
        }
      });
    }

    this.getProductsByFilterGroups();
  }

  initSearch() {
    this.searchInput = document.getElementById("product-search");

    if (!this.searchInput) return;

    this.searchInput.addEventListener("input", () => {
      const text = this.searchInput.value.toLowerCase().trim();

      const filteredProducts = this.productsData.filter(product => {
        return (
          String(product.name || "").toLowerCase().includes(text) ||
          String(product.category_name || "").toLowerCase().includes(text) ||
          String(product.group_name || "").toLowerCase().includes(text) ||
          String(product.SKU || "").toLowerCase().includes(text)
        );
      });

      // this.drawProducts({
      //   success: true,
      //   result: filteredProducts
      // });
    });
  }

  initPriceRange() {
    const priceRange = document.getElementById("priceRange");
    const priceValue = document.getElementById("priceValue");

    if (!priceRange || !priceValue) return;

    const updatePrice = () => {
      priceValue.textContent = `£${priceRange.value}`;
    };

    priceRange.addEventListener("input", updatePrice);
    updatePrice();
  }

  getCategoryFilters() {
    const groups = document.querySelectorAll(".groups");
    const getGroups = [];

    groups.forEach(function(group) {
      if (group.checked) {

        getGroups.push(group.value.split("-")[1]);
      }
    });



    const url = "../../controller/filters/category_filters.php";

    const data = {
      action: "get_categories_filter_and_their_groups",
      groups: getGroups
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) throw new Error("Network error.");

        return response.text();
      })
      .then(text => {
    //    alert(text);

        const result = JSON.parse(text);
        if (result["success"]) {
          this.categoryFilter.innerHTML = "";

          for (let i = 0; i < result["cateogories"].length; i++) {
            if (result["cateogories"][i].approved == 1) {
              this.renderCategoriesFilter(
                result["cateogories"][i].category_id,
                result["cateogories"][i].name,
                result["cateogories"][i].groups
              );
            }
          }

          this.initCategoryAccordion();
        }


      })
      .catch(error => {
        console.error("Error fetching categories:", error);
      });
  }

  getProductsByFilterGroups() {
    const groups = document.querySelectorAll(".groups");
    const getGroups = [];

    groups.forEach(function(group) {
      if (group.checked) {

        getGroups.push(group.value.split("-")[1]);
      }
    });
    // const groupId = group.value.split("-")[1];

  //  alert(JSON.stringify(getGroups));

    const url = "../../controller/filters/category_filters.php";

    const data = {
      action: "get_products_by_groups",
      groups: getGroups

    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)

    })
      .then(response => {
        if (!response.ok) throw new Error("Network error.");

        return response.text();
      })
      .then(result => {
         alert(result);

        const data = JSON.parse(result);

        this.drawSearch();
        this.drawProducts(data["products"]);
        const uniqueTypeVariations = this.removeDuplicateTypeVariations(data["typeVariations"]);

        this.drawTypeVariations(uniqueTypeVariations);
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  removeDuplicateTypeVariations(typeVariations) {
  if (!Array.isArray(typeVariations)) {
    return [];
  }

  const seen = new Set();

  return typeVariations.filter(typeVariation => {
    const typeName = String(typeVariation.type_name || "")
      .toLowerCase()
      .trim();

    if (!typeName) {
      return false;
    }

    if (seen.has(typeName)) {
      return false;
    }

    seen.add(typeName);
    return true;
  });
}

  drawTypeVariations(typeVariations) {
    const groupsFilterGroup = document.getElementById("groups-filter-group");

    if (!groupsFilterGroup) return;

    groupsFilterGroup.innerHTML = ``;

    if (!Array.isArray(typeVariations) || typeVariations.length === 0) {
      groupsFilterGroup.innerHTML = `
        <div class="filter-group" style="--filter-accent: #6b7280;">
          <h1>Filters</h1>
          <p>No filters found.</p>
        </div>
      `;
      return;
    }

    for (let i = 0; i < typeVariations.length; i++) {
      const typeId = typeVariations[i].type_id;
      const typeName = typeVariations[i].type_name;

      const slug = String(typeName)
        .toLowerCase()
        .trim()
        .replaceAll(" ", "_")
        .replaceAll("-", "_")
        .replace(/[^a-z0-9_]/g, "");

      const randomColor = this.getRandomColor();

      groupsFilterGroup.innerHTML += `
        <div
          id="type_${typeId}"
          class="filter-group filter-${slug}"
          style="--filter-accent: ${randomColor};"
        >
          <h1>${typeName}</h1>

          <div class="parent_${slug}_filter scroll_filter ${slug}-scroll">
            <ul id="${slug}_filter" class="checklist ${slug}-list">
              <li>
                <label>
                  <input type="checkbox" name="${slug}[]" value="option_1">
                  Option 1
                </label>
              </li>

              <li>
                <label>
                  <input type="checkbox" name="${slug}[]" value="option_2">
                  Option 2
                </label>
              </li>

              <li>
                <label>
                  <input type="checkbox" name="${slug}[]" value="option_3">
                  Option 3
                </label>
              </li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  getRandomColor() {
    const colors = [
      "#7C3AED",
      "#2563EB",
      "#059669",
      "#EA580C",
      "#DC2626",
      "#0891B2",
      "#9333EA",
      "#16A34A",
      "#F59E0B",
      "#DB2777"
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  drawSearch(){
    this.articles.innerHTML = `
      <div class="products-search-panel">
        <label for="product-search">Search products</label>
        <input
          type="search"
          id="product-search"
          placeholder="Search by name, category, group or SKU..."
          <!-- value="${this.searchInput ? this.searchInput.value : ""}" -->
        <!-- > -->
      </div>

      <h1>All Products</h1>
    `;
  }

  renderCategoriesFilter(category_id, name, groups) {
    const safeId = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    var groups_HTML = this.renderGroupsFilters(category_id, name, groups);

    // alert(JSON.stringify(groups_HTML));

    this.categoryFilter.insertAdjacentHTML("beforeend", `
      <li class="category-accordion-item">
        <button class="category-accordion-btn" type="button">
          <span>${name}</span>
          <span class="category-accordion-icon">+</span>
        </button>

        <div class="category-groups">
          ${groups_HTML}
        </div>
      </li>
    `);
  }

  renderGroupsFilters(category_id, name, groups) {
    var groups_HTML = `
      <label>
        <input class="all_groups" type="checkbox" name="group[]" value="${category_id}">
        <span>All groups</span>
      </label>
    `;

    for (var i = 0; i < groups.length; i++) {
      // alert(JSON.stringify(groups));

      groups_HTML += `
        <label>
          <input class="groups" type="checkbox" name="group[]" value="${category_id}-${groups[i].group_id}">
          <span>${groups[i].name}</span>
        </label>
      `;
    }

    return groups_HTML;
  }

  initCategoryAccordion() {
    const buttons = document.querySelectorAll(".category-accordion-btn");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const item = button.closest(".category-accordion-item");

        if (!item) return;

        item.classList.toggle("is-open");

        const icon = button.querySelector(".category-accordion-icon");

        if (icon) {
          icon.textContent = item.classList.contains("is-open") ? "−" : "+";
        }
      });
    });
  }

  fetchGetProducts() {
    const url = "../../controller/products/product.php";

    const data = {
      action: "get_products"
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) throw new Error("Network error.");

        return response.text();
      })
      .then(result => {
        // alert(result);

        const data = JSON.parse(result);

        this.articles.innerHTML = `
          <div class="products-search-panel">
            <label for="product-search">Search products</label>
            <input
              type="search"
              id="product-search"
              placeholder="Search by name, category, group or SKU..."
              <!-- value="${this.searchInput ? this.searchInput.value : ""}" -->
            <!-- > -->
          </div>

          <h1>All Products</h1>
        `;

        this.initSearch();
        this.drawSearch();
        this.drawProducts(data["result"]);
      })
      .catch(error => {
        console.error("Error:", error);
      });
  }

  drawProducts(data) {
//  alert(JSON.stringify(data));

  this.productsData = Array.isArray(data) ? data : [];

  if (!Array.isArray(data) || data.length === 0) {
    this.articles.innerHTML += `<p>No products found.</p>`;
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const product = data[i];

    if (product.is_approved == 1) {
      const firstImage = product.images && product.images.length > 0
        ? product.images[0]
        : "../../../view/product/products/img/icon_products.png";

      this.articles.innerHTML += `
        <div class="box_article">
          <img src="../../${firstImage}" alt="${product.name || 'Product image'}">

          <h1>${product.name || 'Unnamed product'}</h1>
          <p>${product.category_name || 'No category'}</p>
          <p>${product.group_name || 'No group'}</p>

          <button
            class="buttom_products"
            type="button"
            onclick="productsClass.buyProduct('${product.SKU}')"
          >
            Buy
          </button>
        </div>
      `;
    }
  }
}

  buyProduct(sku) {
    window.location.href = `../../view/preview_product_customers/index.php?sku=${encodeURIComponent(sku)}`;
  }
}

const productsClass = new ProductsClass();
