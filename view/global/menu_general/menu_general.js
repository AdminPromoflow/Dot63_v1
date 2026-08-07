(() => {
  "use strict";

  class CustomerMenu {
    constructor(root) {
      this.root = root;
      this.toggle = root.querySelector(".general-menu__toggle");
      this.backdrop = root.querySelector(".general-menu__backdrop");
      this.navigation = root.querySelector(".general-menu__nav");
      this.cartLink = root.querySelector("#general-menu-cart");
      this.cartDot = root.querySelector(".general-menu__cart-dot");
      this.logoutButton = root.querySelector("#customer-menu-logout");
      this.status = root.querySelector("#general-menu-status");
      this.lastFocusedElement = null;

      this.bindNavigation();
      this.bindCartUpdates();
      this.bindLogout();
      this.syncCartStatus();
    }

    bindNavigation() {
      this.toggle?.addEventListener("click", () => {
        this.setOpen(!this.root.classList.contains("is-open"));
      });

      this.backdrop?.addEventListener("click", () => this.setOpen(false));

      this.navigation?.addEventListener("click", (event) => {
        if (event.target.closest("a")) this.setOpen(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.root.classList.contains("is-open")) {
          this.setOpen(false, true);
        }
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth >= 900) this.setOpen(false);
      });
    }

    setOpen(open, restoreFocus = false) {
      if (!this.toggle) return;

      if (open) this.lastFocusedElement = document.activeElement;
      this.root.classList.toggle("is-open", open);
      this.toggle.setAttribute("aria-expanded", String(open));
      this.toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");

      if (open) {
        this.navigation?.querySelector("a, button")?.focus({ preventScroll: true });
      } else if (restoreFocus && this.lastFocusedElement instanceof HTMLElement) {
        this.lastFocusedElement.focus({ preventScroll: true });
      }
    }

    bindCartUpdates() {
      window.addEventListener("promoflow:cart-updated", (event) => {
        const count = Number(event.detail?.count);
        this.setCartCount(Number.isFinite(count) && count >= 0 ? count : 1);
      });

      window.addEventListener("storage", (event) => {
        if (event.key !== "promoflow_cart_count") return;
        const count = Number(event.newValue);
        if (Number.isFinite(count) && count >= 0) this.setCartCount(count);
      });
    }

    async syncCartStatus() {
      if (this.root.dataset.sessionType === "guest" || !this.root.dataset.cartStatusUrl) return;

      try {
        const response = await fetch(new URL(this.root.dataset.cartStatusUrl, window.location.href), {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_cart_status" })
        });
        const result = await response.json();

        if (response.ok && result.success && Number.isFinite(Number(result.cart_count))) {
          this.setCartCount(Number(result.cart_count));
        }
      } catch (_) {
        // Keep the server-rendered state when the cart status cannot be refreshed.
      }
    }

    setCartCount(count) {
      const normalizedCount = Math.max(0, Math.floor(count));
      const hasItems = normalizedCount > 0;

      this.root.dataset.cartCount = String(normalizedCount);
      this.cartDot?.classList.toggle("is-visible", hasItems);
      this.cartLink?.setAttribute("aria-label", hasItems
        ? "Shopping cart, contains products"
        : "Shopping cart, empty");

      try {
        window.localStorage.setItem("promoflow_cart_count", String(normalizedCount));
      } catch (_) {
        // The server session remains the source of truth when storage is unavailable.
      }
    }

    bindLogout() {
      this.logoutButton?.addEventListener("click", () => this.logout());
    }

    async logout() {
      if (!this.logoutButton || this.logoutButton.disabled) return;

      this.logoutButton.disabled = true;
      this.logoutButton.setAttribute("aria-busy", "true");
      if (this.status) this.status.textContent = "Signing out…";

      try {
        const response = await fetch(new URL(this.root.dataset.logoutUrl, window.location.href), {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: this.root.dataset.logoutAction })
        });
        const result = await response.json();

        const logoutSucceeded = result.success === true || result.response === true;
        if (!response.ok || !logoutSucceeded) {
          throw new Error(result.error || "Unable to sign out.");
        }

        try {
          window.localStorage.removeItem("promoflow_cart_count");
        } catch (_) {
          // Ignore storage restrictions; the session was already closed.
        }

        window.location.assign(new URL(this.root.dataset.logoutRedirect, window.location.href));
      } catch (error) {
        this.logoutButton.disabled = false;
        this.logoutButton.removeAttribute("aria-busy");
        if (this.status) this.status.textContent = error.message || "Unable to sign out. Please try again.";
      }
    }
  }

  const root = document.getElementById("general-menu");
  if (root) new CustomerMenu(root);
})();
