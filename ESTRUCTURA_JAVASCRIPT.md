# Estructura de los módulos JavaScript

Cada controlador de interfaz sigue el flujo usado en `ClassGroup`:

1. El constructor obtiene las referencias y registra los eventos una sola vez.
2. El evento llama a un método que representa una acción.
3. Ese método captura los parámetros, prepara la URL y los datos, y espera a `this.makeRequest(url, data)`.
4. La respuesta vuelve al mismo método. Allí se valida y se llaman las funciones de renderizado, estado o navegación.

No hay métodos `init()` ni una llamada adicional para arrancar la instancia. Cuando una página necesita esperar al DOM, la creación o los eventos del constructor esperan a `DOMContentLoaded`.

```javascript
class Example {
  constructor() {
    this.editButton = document.getElementById('edit');
    this.editButton.addEventListener('click', () => this.edit());
    this.getData();
  }

  async edit() {
    const params = new URLSearchParams(window.location.search);
    const url = '../../controller/products/group.php';
    const data = { action: 'get_groups', sku: params.get('sku') };

    try {
      const response = await this.makeRequest(url, data);
      if (!response?.success) return;
      this.drawList(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // getData(), drawList() y el makeRequest() local del archivo.
}
```

Cada archivo que hace consultas tiene su propio `makeRequest()`. Todas las copias tienen la misma implementación; no dependen de un transporte global. Los archivos dedicados únicamente a renderizar o mantener estado no necesitan hacer peticiones.

`makeRequest()` conserva las cookies de sesión, envía JSON o `FormData`, y devuelve la respuesta ya interpretada. Acepta `headers` para CSRF y `signal` para cancelar consultas. Los fallos HTTP, de conexión o JSON se manejan en el método que hizo la consulta. `requireSuccess: true` conserva el contrato de los flujos que también rechazan una respuesta con `success: false`; `responseType: 'text'` se reserva al flujo antiguo que recibe texto.

Los elementos creados después de una consulta usan eventos delegados registrados en el constructor. Los renderizadores crean elementos y sus datos, sin registrar nuevos eventos. Los callbacks de Stripe se conectan cuando el SDK crea su elemento de pago y se mantienen separados del transporte AJAX.

La autenticación del preview y el modal de casos están en `auth.js` y `create_case.js`, respectivamente, para que cada archivo tenga un solo `makeRequest()`. Los archivos `preview_api.js` conservan únicamente las rutas de los endpoints. PHP mantiene sus acciones y modelos existentes.

## Verificación

- `node --test tests/frontend_structure.cjs`: comprueba la estructura y los contratos HTTP, archivos, CSRF, errores y cancelación.
- `node tests/frontend_browser.cjs`: requiere Playwright, un navegador instalado y un servidor PHP local. Usa `FRONTEND_TEST_URL`, `CHROME_PATH` y, si hace falta, `NODE_PATH` para indicar esas rutas. Todas las solicitudes a controladores están simuladas. Para probar la vista privada del proveedor, la sesión local de prueba debe tener `login` y `email`.
