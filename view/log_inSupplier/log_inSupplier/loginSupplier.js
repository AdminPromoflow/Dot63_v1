class ClassLogin {
  constructor() {
  const togglePassword = document.querySelector(".toggle-pass");
  togglePassword?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Show" : "Hide";
    togglePassword.dataset.show = showing ? "false" : "true";
    togglePassword.setAttribute("aria-pressed", String(!showing));
    togglePassword.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  loginEnter.addEventListener("click", function(){
    classLogin.makeAjaxRecuest();
  })

  email.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      password.focus();
    }
  });


  password.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      classLogin.makeAjaxRecuest();
    }
  });
  }

  makeAjaxRecuest() {
    const url = "../../controller/users/login.php";
    const data = {
      action: "requestLoginSupplier",
      email: email.value.trim(),
      password: password.value
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        if (data.response === true) {
           window.location.href = "../../view/dashboard_supplier/index.php";
        } else {
          alert(data.error || "Credenciales inválidas");
        }
      })
      .catch(() => {
        alert("Error de red. Intenta nuevamente.");
      });
  }

}

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginEnter = document.getElementById("login_enter");
const classLogin = new ClassLogin();
