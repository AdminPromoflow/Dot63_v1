class ProductsClass {
  constructor() {
    this.fetchGetProducts();
  }
  fetchGetProducts(){
    // alert(email.value + password.value);
    const url = "../../controller/products/product.php";
    const data = {
      action: "get_products",
      email: email.value,
      password: password.value
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
        alert(data);
      })
      .catch(error => {
        // Log any errors to the console.
        console.error("Error:", error);
      });
  }
}


const productsClass = new ProductsClass();
