# Plan de seguridad de Dot63 respetando su estructura actual

Fecha: 9 de septiembre de 2026.

Estado: propuesta, sin cambios funcionales implementados. Los ejemplos describen el diseño; las clases nuevas deben implementarse y probarse antes de utilizarlas. No son un parche completo listo para producción.

## 1. Compromiso de conservación

La estructura actual de Dot63 es la base del trabajo: `controller`, `model`, `view`, sus módulos, rutas AJAX, nombres de acciones y métodos. La inversión existente se conserva mediante cambios pequeños dentro de los archivos que ya cumplen cada responsabilidad.

Se toma de Salamandra la idea de controles comunes antes de ejecutar una acción. Se implementan en `controller/security/`, manteniendo las peticiones hacia sus controladores actuales. No se requiere crear otra aplicación, una carpeta pública nueva, un router dinámico o una nueva jerarquía de servicios. No se introducen dependencias ni una migración de framework como requisito del plan.

Las carpetas de seguridad y pruebas que ya existen reciben los nuevos archivos. Los modelos conservan sus consultas y operaciones; se refuerzan los filtros, la validación y las transacciones necesarias. Cualquier cambio de comportamiento se explica y prueba por módulo.

## 2. Problemas que se van a cerrar

Revisión local, sin explotación de producción:

- `controller/products/product.php`: varias acciones modifican datos sin comprobar uniformemente sesión y propietario; se conserva la comprobación útil existente en publicación.
- `controller/products/price.php`: creación/eliminación de precios sin autorización uniforme.
- `controller/products/image.php`: subida sin sesión/propietario y conservación de extensión original.
- `controller/users/supplier_info.php`: actualización decide qué proveedor modificar mediante un correo recibido del navegador.
- `controller/promoflow/promoflow_webhook.php`: aprobación y consultas sin autenticar al emisor.
- `model/jobs.php`: carrito vinculado al correo dentro de `notes`, compartiendo el criterio entre clientes y proveedores.
- `controller/config/database.php` y `controller/emails/send_emails.php`: secretos incrustados como configuración alternativa.
- Stripe ya verifica sesión, CSRF, propiedad, firma, importe, moneda y eventos repetidos en los flujos revisados. Estos controles se conservan y se prueban nuevamente tras cada cambio relacionado.

El alcance externo debe verificarse con la configuración real del alojamiento. No se promete invulnerabilidad; se entregan controles verificables y pruebas que impidan reintroducir las fallas.

## 3. Estructura propuesta: ampliar los lugares existentes

Los nombres de archivos marcados como NUEVO son propuestas; el resto representa lugares existentes del proyecto.

```text
Dot63_v1/
├── controller/
│   ├── security/
│   │   ├── security_helper.php       # Se conserva su función actual
│   │   ├── bootstrap.php             # NUEVO: carga controles y errores
│   │   ├── request_guard.php         # NUEVO: requisitos por petición
│   │   ├── action_rules.php          # NUEVO: acciones y acceso permitido
│   │   ├── session_manager.php       # NUEVO: sesión e identidad
│   │   ├── csrf.php                  # NUEVO: emisión/validación del token
│   │   ├── access_policy.php         # NUEVO: permisos sobre registros
│   │   ├── input_validator.php       # NUEVO: validaciones reutilizables
│   │   ├── upload_validator.php      # NUEVO: validación de archivos
│   │   └── audit_logger.php          # NUEVO: eventos sensibles
│   ├── products/                    # Controladores actuales reforzados
│   ├── customers/
│   ├── users/
│   ├── order/                       # Se preserva la integración Stripe
│   ├── promoflow/
│   └── config/migrations/           # Migraciones aditivas y versionadas
├── model/                           # Modelos actuales con filtros de propiedad
├── view/
│   └── global/security/
│       ├── security_helper.js        # Se conserva
│       └── request_helper.js         # NUEVO: utilidad AJAX opcional y gradual
├── tests/
│   └── security/                    # NUEVO: pruebas de controles
└── docs/PLAN_SEGURIDAD.md
```

`security_helper.php` actualmente comprueba parámetros de producto/variación; no se le atribuye una autenticación que no realiza. Los nuevos helpers tienen responsabilidades pequeñas y separadas. Se evita convertir ese archivo en una clase que haga de todo.

El código, los SQL, registros y secretos se protegen mediante reglas de alojamiento y acceso directo. Para archivos privados, se configura una ubicación fuera de la raíz web mediante una variable de entorno; esto no obliga a mover `controller`, `model` o `view`.

## 4. Recorrido conservado de una petición

```text
JavaScript existente
  → controller/products/product.php
  → RequestGuard verifica método, sesión, acción y CSRF
  → El mismo switch de acciones
  → El mismo método del controlador
  → Modelo verifica propiedad y ejecuta la operación
  → Respuesta compatible con el frontend actual
```

Es una sola petición HTTP. Los helpers son llamadas internas de PHP. No se añaden redirecciones ni peticiones intermedias entre archivos.

### Ejemplo en el controlador existente

```php
require_once __DIR__ . '/../security/bootstrap.php';

class Product {
    public function handleProduct() {
        // API propuesta: limita el cuerpo, valida JSON y devuelve un array.
        $data = RequestGuard::jsonBody();
        RequestGuard::authorize('products.product', $data);

        // Se conserva el despacho explícito actual.
        switch ($data['action']) {
            case 'delete_product':
                $this->deleteProduct($data);
                break;
            // Las demás acciones existentes mantienen sus nombres.
        }
    }
}
```

La clave `products.product` la escribe el desarrollador, no se toma de la petición. La lista de reglas no genera nombres de clases/métodos a partir de texto del navegador.

### Reglas declaradas por acción

```php
return [
    'products.product' => [
        'delete_product' => [
            'method' => 'POST',
            'auth' => 'supplier',
            'csrf' => true,
            'rate_limit' => 'catalog.write',
        ],
        'publish_product' => [
            'method' => 'POST',
            'auth' => 'supplier',
            'csrf' => true,
            'rate_limit' => 'catalog.publish',
        ],
    ],
];
```

Este es un extracto: se inventarían y registrarían todas las acciones actuales. La acción sin regla queda denegada. Las consultas públicas se declaran como públicas y sus modelos filtran catálogo visible. Las consultas privadas de proveedores exigen sesión y propiedad. Que una acción se llame `get_*` no la hace pública por sí sola.

Cada controlador entra al control común antes del switch. Los formatos actuales JSON o multipart se mantienen donde correspondan, con tipos de contenido explícitos y límites. El inventario también cubre rutas alternativas, archivos de pruebas accesibles y controladores que se incluyen desde otros archivos. Ningún alias antiguo puede omitir la protección.

## 5. Identidad, sesiones y permisos

Se conservan las tablas separadas de clientes y proveedores. La sesión incorpora identificadores reales leídos de la BD: `supplier_id` para proveedor y `customer_id` para cliente. Los campos actuales de email y banderas pueden mantenerse durante la transición, pero no autorizan registros por sí solos.

No se asigna identidad, rol o propietario desde parámetros. Al actualizar un perfil, el ID procede de la sesión. Si se permite cambiar el correo, se trata como una operación independiente con verificación, nunca como la condición que selecciona el perfil ajeno.

Configuración ilustrativa para producción, antes del primer inicio de sesión:

```php
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
```

Se usa una configuración explícita diferente para desarrollo local HTTP. Producción exige HTTPS. Si existe proxy, se confía únicamente en los proxies configurados. Se revisa el alcance de cookie para no compartir sesiones entre aplicaciones distintas en el mismo alojamiento.

El gestor común aplica regeneración al login, caducidad por inactividad y absoluta, revocación por cambio de contraseña/desactivación y cierre completo de sesión/cookie. Al cambiar de identidad se limpia el estado temporal de la cuenta anterior. Los proveedores reciben la misma protección que clientes.

Se mantiene `password_hash`/`password_verify`; se añaden límites de intentos por cuenta e IP mediante contadores atómicos, verificación del correo antes de operaciones sensibles y recuperación con token aleatorio de un solo uso guardado como hash. La incorporación de MFA corresponde a accesos administrativos y de aprobación; no se convierte un proveedor normal en administrador.

### Propiedad dentro de los modelos existentes

`Products` ya tiene `setSupplierId()`. Se utiliza desde la sesión:

```php
private function deleteProduct($data) {
    $supplierId = SessionManager::requireSupplierId();
    $sku = InputValidator::sku($data['sku'] ?? null);

    $product = new Products(new Database());
    $product->setSku($sku);
    $product->setSupplierId($supplierId);

    // El método existente se refuerza para exigir ambos datos.
    echo json_encode($product->deleteProduct());
}
```

En `model/products.php`, dentro de la transacción existente y ANTES de cualquier borrado relacionado:

```php
$stmt = $pdo->prepare(
    'SELECT product_id, status, is_approved
     FROM products
     WHERE SKU = :sku AND supplier_id = :supplier_id
     FOR UPDATE'
);
$stmt->execute([
    ':sku' => $this->sku,
    ':supplier_id' => $this->supplier_id,
]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$product) {
    // El handler central traduce el error; la transacción se revierte.
    throw new HttpException(404, 'PRODUCT_NOT_FOUND');
}
```

Este fragmento se integra con rollback y la comprobación de transición permitida. Los modelos fallan si falta el propietario; no ofrecen un fallback sin filtro para conservar llamadas antiguas. Se actualizan todos sus llamadores. Operaciones de integración, si las hay, tienen una autorización separada y explícita.

El ID autorizado se usa para las operaciones relacionadas. Precios, variaciones e imágenes verifican su relación con el producto y proveedor; el SKU/ID del hijo nunca basta. Se comprueba coherencia entre producto e hijo. Para ediciones se distingue un valor sin cambios de un recurso inexistente: `rowCount() === 0` no decide por sí solo la autorización.

La política define además quién puede modificar un producto aprobado y cuándo un cambio necesita nueva revisión. El visitante solo ve productos publicables y campos públicos; un proveedor ve y modifica sus recursos conforme al estado; Promoflow solo ejecuta sus acciones de integración autorizadas.

## 6. CSRF y frontend compatible

Token generado por el servidor con sesión iniciada:

```php
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
```

Validación compartida de operaciones con cookies que cambian datos:

```php
$expected = $_SESSION['csrf_token'] ?? null;
$provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (!is_string($expected) || $expected === ''
    || !is_string($provided) || !hash_equals($expected, $provided)) {
    throw new HttpException(403, 'INVALID_CSRF_TOKEN');
}
```

El token se incorpora a una plantilla común o respuesta de sesión de la misma procedencia y sin caché. No se expone en URLs. Se renueva al cambiar de identidad y tras login. `SameSite` complementa el token. Login/logout también se incluyen en la política apropiada; Stripe conserva su token actual hasta que se migren servidor y cliente conjuntamente. Webhooks no usan CSRF ni cookies de usuario: verifican autenticidad propia.

Ejemplo del pequeño cambio en una petición actual, conservando URL y action:

```javascript
// URL y objeto data son los que ya utiliza el módulo.
const response = await fetch(urlActualDelControlador, {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfTokenDelServidor,
  },
  body: JSON.stringify(data),
});
```

El helper común se incorpora progresivamente. Para `FormData` no establece `Content-Type` manualmente. Nunca envía el token a otro origen. Se conservan contratos actuales donde sea posible; servidor y consumidor se cambian juntos si es necesario corregirlos. Un error siempre expresa `success: false` con el código HTTP adecuado, no una cadena verdadera evaluada como éxito.

El navegador maneja sesión vencida, validación, respuesta no JSON y errores de red. Los mensajes se muestran con `textContent`. El controlador valida tipos, rangos y campos permitidos antes de convertirlos. No recibe cambios arbitrarios de `role`, `supplier_id` o `is_approved`. Las consultas siguen usando parámetros. En PHP se escapa texto con `htmlspecialchars(..., ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`; HTML enriquecido y URLs requieren políticas específicas.

## 7. Archivos: reforzar los controladores actuales

`image.php` y `variations.php` reutilizan `upload_validator.php`, conservando sus funciones de negocio y rutas. Las validaciones útiles ya existentes en variaciones se aprovechan.

Secuencia: sesión → CSRF → propiedad de variación/producto → errores de subida → `is_uploaded_file()` → tamaño real/cantidad → MIME detectado → dimensiones/presupuesto de píxeles → decodificación y recodificación → nombre aleatorio → almacenamiento → registro en BD.

Ejemplo parcial, después de validar subida y autorización:

```php
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
if (!isset($allowed[$mime])) {
    throw new HttpException(415, 'UNSUPPORTED_IMAGE_TYPE');
}
$storedName = bin2hex(random_bytes(20)) . '.' . $allowed[$mime];
```

El fragmento no reemplaza tamaño, límites de píxeles ni recodificación. Los PDF tienen reglas separadas, tratamiento como descarga/documento y cuarentena/escaneo cuando corresponda. Se bloquea ejecución en todas las carpetas antiguas y nuevas de subida.

Las imágenes públicas conservan su uso visual; los documentos privados se almacenan fuera de la raíz web y se descargan mediante un ID autorizado. Nunca se acepta una ruta arbitraria del visitante. La migración de enlaces conserva referencias existentes mediante mapeos controlados. Si falla el registro de BD se eliminan archivos temporales; se contemplan colisiones y operaciones simultáneas.

## 8. Carrito: cambio mínimo del esquema existente

Mantener `customers`, `suppliers`, `jobs` y `orders`. Propuesta aditiva en `jobs`:

```text
owner_customer_id → customers.customer_id, opcional
owner_supplier_id → suppliers.supplier_id, opcional
```

Un carrito tiene exactamente uno de esos propietarios. Se agregan claves foráneas/índices y se comprueba la exclusividad en aplicación y BD cuando la versión real soporte la restricción. No se crea una tabla nueva de cuentas como requisito.

Ejemplo para un cliente:

```sql
SELECT job_id, quantity, subtotal
FROM jobs
WHERE job_id = :job_id
  AND owner_customer_id = :customer_id
  AND owner_supplier_id IS NULL
  AND status = 'cart';
```

Para proveedores se usa una consulta explícita equivalente por `owner_supplier_id`. El tipo de sesión selecciona el flujo; no se concatena un nombre de columna recibido del navegador. El pago sigue exigiendo sesión de cliente y mantiene `orders.customer_id`.

Migración: inventariar registros y duplicados; añadir columnas; adaptar nuevas escrituras; asignar propietarios históricos solo cuando sean verificables; separar casos ambiguos; retirar lectura por `notes`/correo. Un correo compartido no decide automáticamente la propiedad. Los carritos no reconciliados permanecen inaccesibles hasta resolución. No se mantiene un fallback inseguro al correo.

Los pedidos históricos y el resto de datos se conservan. Se revisa el esquema real antes de ejecutar SQL: el archivo de esquema puede diferir de la base instalada.

## 9. Stripe y Promoflow dentro de su estructura actual

Stripe: mantener firma SDK sobre cuerpo original, sesión/CSRF de checkout, propiedad de dirección/pedido, importe/moneda e idempotencia. Probar confirmación, reintentos, correos y eventos tardíos después de adaptar propietario de carrito.

El importe se obtiene de datos autorizados y una versión coherente del pedido. Revisar columnas monetarias con FLOAT y migrarlas cuidadosamente a DECIMAL/unidades menores, comparando totales históricos sin alterarlos arbitrariamente. El pedido pagado no se edita por rutas alternativas. Carrito y preparación de pago requieren estados/bloqueos compatibles; si un intento puede cobrar la versión anterior, se congela esa versión o se cancela de forma confirmada antes de reemplazarla. No se presupone éxito o fracaso ante un timeout.

Promoflow: autenticar ambos extremos con credencial exclusiva y alcance de aprobación/lectura limitado. Si se controlan emisor y receptor, acordar HMAC-SHA256 sobre fecha, ID de evento y cuerpo original; comprobar firma en tiempo constante, ventana temporal y límites. Registrar ID único y efecto dentro de una transacción. Los reintentos legítimos devuelven resultado sin duplicarlo. La configuración se coordina con el emisor para no abrir temporalmente el receptor. Stripe conserva su protocolo y SDK propios.

## 10. Servidor, secretos y registros

La estructura física actual se conserva. El alojamiento bloquea accesos web a `model/`, configuración, SQL, `.git`, tests, registros, secretos y helpers internos; los includes PHP del servidor siguen funcionando. Se inventarían páginas PHP bajo `view/` que deban ser entradas legítimas y se les aplica su sesión/permisos donde corresponda, evitando bloqueos generales que rompan pantallas.

Rotar credenciales incrustadas, suministrarlas por entorno o archivo privado y retirar el fallback secreto. No publicar valores en documentación/logs. Separar entornos y credenciales; usuario de ejecución de BD con permisos mínimos y migraciones con credencial distinta. No eliminar todo el directorio de dependencias si contiene assets públicos necesarios: se restringe según el inventario.

Configurar HTTPS, límites y cabeceras `nosniff`/política de referencia. Probar CSP primero en reporte y luego aplicarla con los orígenes reales de Stripe, scripts y estilos. HSTS después de confirmar cobertura HTTPS. CORS restringido a casos necesarios; no reemplaza permisos.

Auditar cambios sensibles y denegaciones con identidad, acción, recurso, resultado y request_id. No guardar contraseñas, cookies, claves, tokens o cuerpos completos con datos personales. Registros privados con rotación/retención. Actualizar PHP/dependencias, incluidas librerías copiadas fuera de Composer. Probar restauración de respaldos y establecer alertas accionables.

## 11. Fases y pruebas de aceptación

| Fase | Trabajo | Resultado comprobable |
| --- | --- | --- |
| 0 | Inventario, entorno aislado, contratos AJAX y respaldo | Pruebas sin correos/cobros reales ni BD de producción |
| 1 | Proteger escrituras actuales, subidas, perfiles y Promoflow; rotar secretos | No hay escritura anónima o sobre recursos ajenos |
| 2 | Incorporar helpers y reglas por acción módulo a módulo | Todas las entradas ejecutan controles comunes; frontend sigue funcionando |
| 3 | Propiedad por IDs y migración aditiva del carrito | Cliente/proveedor con mismo correo tienen carritos separados |
| 4 | Servidor, salida segura, archivos privados y registros | Código interno/documentos privados no accesibles por URL |
| 5 | Regresión, pruebas manuales y despliegue gradual | Controles verificados y reversión que no reabra fallas |

Primero se entrega un módulo completo y pequeño, con su frontend actual funcionando. Se repite el patrón en productos, precios, imágenes, proveedores, carritos e integraciones. Las urgencias de la fase 1 no esperan una reorganización general. Cada cambio se presenta por archivo: problema, modificación, comportamiento conservado y prueba realizada.

Las pruebas usan visitante, dos proveedores y dos clientes, además de eventos de integración ficticios. Se verifica tanto el código HTTP como ausencia de cambios no autorizados en BD/archivos/pagos.

| Prueba | Resultado |
| --- | --- |
| Sin sesión: editar/eliminar/subir | 401, sin cambios |
| Proveedor A opera sobre recurso de B | Denegado, sin cambios |
| Modificar propietario/rol/aprobación en JSON | No concede facultades; campo rechazado según contrato |
| Perfil seleccionado por correo ajeno | No modifica al otro proveedor |
| CSRF ausente/incorrecto | 403 en operaciones protegidas |
| Ruta alternativa, action desconocida o método incorrecto | Denegado |
| Sesión antigua de cuenta desactivada | Revocada |
| Mismo correo en cliente/proveedor | Carritos separados |
| Pedido/dirección de otro cliente | Denegado |
| Archivo ejecutable, MIME falso, tamaño/píxeles excesivos | Rechazado y no accesible |
| Texto HTML en nombre de producto | Se muestra como texto |
| Firma falsa de webhook | Sin efecto |
| Webhook válido repetido | Sin efecto duplicado |
| Importe/moneda distintos | No marcar como pagado |
| Evento tardío tras pago | No degrada el pedido |
| Actualización simultánea de carrito/pago | Pedido, líneas e importe coherentes |
| URL de código interno, SQL o prueba | Acceso bloqueado |
| Restaurar respaldo | Datos y funcionamiento recuperados |

Ampliar las pruebas existentes de frontend, correo y Stripe. No ejecutar scripts de integración que escriban en la BD hasta confirmar un entorno de pruebas exclusivo. Complementar con ZAP/Burp delimitados a esa copia; un escaneo sin alertas no demuestra ausencia de fallas de negocio.

## Referencias de los controles

- [OWASP: autorización](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): controles por petición y recurso, denegación por defecto.
- [OWASP: CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): tokens para operaciones con autenticación por cookies.
- [OWASP: archivos](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): validación en varias capas y almacenamiento protegido.
- [OWASP: sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): cookies y ciclo de vida de sesiones.
