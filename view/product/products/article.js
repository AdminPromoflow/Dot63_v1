class ProductsClass {
  constructor() {
    this.fetchGetProducts();
  }
  fetchGetProducts(){
    // alert(email.value + password.value);
    const url = "../../controller/products/product.php";
    const data = {
      action: "get_products"
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
      .then(result => {
        const data = JSON.parse(result);
        this.drawProducts(data);
      })
      .catch(error => {
        // Log any errors to the console.
        console.error("Error:", error);
      });
  }
  drawProducts(data){
    alert(JSON.stringify(data));
    articles.innerHTML = "";
    for (var i = 0; i < data.result.length; i++) {
      articles.innerHTML += `
      <div class="box_article">
        <img src="../../view/login/main/img/bags.png" alt="">
        <h1>${data.result[i].name}</h1>
        <p>Paper Bags</p>
        <p>Large</p>
        <p>£ 0.6</p>
        <button
          class="buttom_products"
          type="button"
          name="button"
          onclick="productsClass.buyProduct('${data.result[i].sku}')"
        >
          Buy
        </button>
      </div>
      `
    }
  }

  buyProduct(sku) {
  alert(sku);
  }

}

const articles = document.getElementById("articles");
const productsClass = new ProductsClass();
