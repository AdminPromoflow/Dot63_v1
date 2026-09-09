class Menu_Supplier {
  constructor() {
    // Header para mostrar/ocultar con scroll
    this.header = document.querySelector('.site-header');
    this.lastScrollY = window.scrollY;
    this.ticking = false;

    // Verificar login al iniciar
    this.verifyLogin();

    // Botón logout (si existe)
    if (logout) {
      logout.addEventListener("click", () => {
        this.logout();
      });
    }
    {
      if (this.header) {
        window.addEventListener('scroll', () => this.handleWindowScroll());
      }
    }
  }

  // ====== HEADER SCROLL HIDE ======

  handleScroll() {
    const currentScroll = window.scrollY;

    // Si bajamos y hemos pasado un poco (80px) -> esconder
    if (currentScroll > this.lastScrollY && currentScroll > 80) {
      this.header.classList.add('site-header--hidden');
    } else {
      // Si subimos o estamos muy arriba -> mostrar
      this.header.classList.remove('site-header--hidden');
    }
    this.lastScrollY = currentScroll;
    this.ticking = false;
  }

  // ====== LOGOUT ======

  async logout() {
    const url = "../../controller/users/login.php";
    const data = {
      action: "logout_supplier"
    };
    try {
      const response = await this.makeRequest(url, data);
      if (JSON.parse(response["response"])) {
        location.reload();
      } else {
        alert("Sign-out failed. Please try again.");
      }
    } catch (error) {
      alert("Error de red. Intenta nuevamente.");
    }
  }

  showHideLogoutButton(visible) {
    if (!logout) return;
    if (visible) {
      logout.style.display = "block";
    } else {
      logout.style.display = "none";
    }
  }

  // ====== VERIFICAR LOGIN ======

  async verifyLogin() {
    const url = "../../controller/users/login.php";
    const data = {
      action: "verify_login_supplier"
    };
    try {
      const response = await this.makeRequest(url, data);
      //  alert(JSON.stringify(data));

      // Más claro: si NO está logueado
      if (response['response'] !== true) {
        if (window.location.href.slice(-29) != "view/log_inSupplier/index.php") {
          if (window.location.href.slice(-31) != "view/sign_up_supplier/index.php") {
            window.location.href = "../../view/log_inSupplier/index.php";
          }
        }
        this.showHideLogoutButton(false);
      }
      // Si está logueado y está en login o sign up -> mandar al dashboard
      else if (window.location.href.slice(-29) == "view/log_inSupplier/index.php" || window.location.href.slice(-29) == "view/sign_up_supplier/index.php") {
        window.location.href = "../../view/dashboard_supplier/index.php";
        this.showHideLogoutButton(true);
      }
      // Logueado y en cualquier otra página
      else {
        this.showHideLogoutButton(true);
      }
    } catch (error) {
      alert("Error de red. Intenta nuevamente.");
    }
  }

  handleWindowScroll() {
    if (!this.ticking) {
      window.requestAnimationFrame(() => this.handleScroll());
      this.ticking = true;
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

// Elemento logout del DOM
const logout = document.getElementById("logout");

// Instancia global
const menu_supplier = new Menu_Supplier();
