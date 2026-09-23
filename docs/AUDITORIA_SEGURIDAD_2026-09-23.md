# Revisión de seguridad de Dot63

Fecha: 23 de septiembre de 2026.

**Resultado: seguridad insuficiente para producción. Riesgo alto, con una subida de archivos de impacto potencialmente crítico.** Hay controles útiles en autenticación, checkout y publicación, pero no se aplican a todas las rutas que acceden a datos o los modifican.

## Alcance y evidencia

Se revisaron controladores PHP, modelos, sesiones, configuración, algunas salidas JavaScript, dependencias instaladas y la configuración local de XAMPP. Se hicieron consultas HTTP puntuales a `127.0.0.1/Dot63_v1`, sin credenciales, y comprobaciones de cabeceras con HEAD. Las comprobaciones no enviaron operaciones de borrado, subidas de archivos, modificaciones de perfiles ni cobros; la petición de aprobación carecía de sesión y de identificadores y fue rechazada antes de ejecutar la operación.

Los hallazgos distinguen evidencia de código y comprobaciones HTTP. No se auditó el alojamiento de producción, su firewall, TLS, copias de seguridad, permisos reales de BD ni infraestructura de Stripe. No se ejecutaron las suites de integración que podrían escribir en la base de datos o enviar correos. No se modificó el código funcional ni la configuración: este informe es el único archivo añadido por la revisión.

La severidad es una priorización técnica, no una puntuación CVSS ni una certificación. No se incluyen contraseñas, cookies ni datos personales en este informe.

## Hallazgos prioritarios

### 1. Subida de archivos sin autorización ni lista de tipos permitidos

**Prioridad: inmediata. Impacto potencialmente crítico. Evidencia: código.**

- `controller/products/image.php:25` despacha `create_update_images` sin exigir sesión, propiedad del producto o CSRF.
- `controller/products/image.php:69` resuelve el proveedor a partir del SKU enviado, sin verificar que sea el solicitante.
- `controller/products/image.php:165` guarda dentro de `controller/uploads/`, bajo la raíz web.
- `controller/products/image.php:178` conserva la extensión del archivo recibido; antes de moverlo no comprueba una lista permitida de extensiones ni el MIME real. Los límites generales de PHP no sustituyen esta validación.
- `controller/products/image.php:118` reconoce que un fallo posterior de BD deja el archivo en disco.

Esto permite aceptar archivos que no son imágenes. Si el servidor ejecuta PHP u otros tipos ejecutables dentro de uploads, puede convertirse en ejecución de código con los permisos del servidor. No se subió ni ejecutó un archivo de prueba: esa última consecuencia depende de la configuración efectiva. El Apache local sirve el directorio de uploads con HTTP 200 y no se encontraron reglas `.htaccess` dentro del proyecto que impidan ejecución allí.

**Corrección:** exigir sesión, CSRF y propietario antes de tocar archivos o BD; limitar tamaño y cantidad; detectar MIME, decodificar/recodificar imágenes y asignar extensión y nombre desde el servidor. Bloquear ejecución en las carpetas de subida y almacenar documentos privados fuera de la raíz web. Eliminar archivos huérfanos si falla el registro.

### 2. Modificación y borrado de catálogo sin comprobar identidad y propietario

**Prioridad: inmediata. Severidad: alta. Evidencia: código en controlador y modelo.**

- `controller/products/product.php:81` permite llegar al borrado usando únicamente el SKU. `model/products.php:1303` inicia el borrado y `model/products.php:1494` busca el producto solo por SKU, sin proveedor.
- El borrado incluye precios, imágenes, ítems, variaciones y detalles asociados de trabajos: su efecto puede superar la desaparición de una ficha de producto.
- `controller/products/product.php:268` y `controller/products/product.php:284` permiten modificar categoría/grupo sin comprobar propiedad. `model/products.php:995` actualiza por SKU.
- `controller/products/price.php:57` y `controller/products/price.php:127` borran o reemplazan precios sin autenticación. `model/prices.php:240` puede borrar por ID solamente.
- El patrón también aparece en `controller/products/item.php` y `controller/products/variations.php`.

Una persona que conozca un identificador puede solicitar modificaciones directamente a los controladores, aunque la interfaz no le muestre botones. Las consultas preparadas evitan que los parámetros se interpreten como SQL, pero no determinan quién tiene permiso para ejecutarlas.

**Corrección:** control común antes de cada acción y autorización en las consultas mediante identidad obtenida de sesión. Cada variación, precio, imagen e ítem debe vincularse al producto autorizado. No dejar rutas alternativas con filtros opcionales.

### 3. Edición de perfiles ajenos mediante el correo recibido

**Prioridad: inmediata. Severidad: alta. Evidencia: código.**

`controller/users/supplier_info.php:50` inicia una sesión, pero no exige un usuario autenticado. En la línea 63 utiliza `$data['email']` como selector del proveedor. `model/users.php:295` actualiza nombre, empresa, teléfono y dirección con `WHERE email = :email`.

Iniciar una sesión no equivale a autenticarla. El solicitante puede seleccionar otro proveedor mediante su correo; además, esos correos se exponen en el hallazgo 4. Esta ruta no cambia la contraseña, por lo que no se afirma una toma directa de cuenta por esta operación.

**Corrección:** seleccionar la cuenta por un ID de proveedor obtenido de una sesión autenticada; ignorar el correo del formulario como criterio de autorización. Validar campos y CSRF.

### 4. Consulta anónima de proveedores

**Prioridad: alta. Severidad: alta en combinación con la edición de perfiles. Evidencia: HTTP y código.**

`controller/promoflow/promoflow_webhook.php:20` limita el control de sesión a `approve_product` y `publish_product`. La acción `get_suppliers` llega a `getAllUsers()` sin ese control (`controller/promoflow/promoflow_webhook.php:89`). `model/users.php:81` selecciona ID, nombre de contacto y correo.

**Verificación local:** una petición sin cookies con `action=get_suppliers` devolvió HTTP 200, `response=true`, un registro y los campos `supplier_id`, `contact_name`, `email`. Los valores se omitieron de la salida de revisión.

**Corrección:** exigir autorización de integración o de usuario para cada acción privada y devolver únicamente los campos necesarios. Revisar también las consultas antiguas de pendientes y previews, en vez de proteger exclusivamente la aprobación.

### 5. Archivos internos accesibles y secretos incluidos en Git

**Prioridad: inmediata. Severidad: alta; impacto combinado potencialmente crítico. Evidencia: HTTP local, código y seguimiento de Git.**

Se obtuvieron respuestas HEAD HTTP 200 para:

- `/.git/config`.
- `/controller/config/mySQL.sql`.
- `/controller/config/inserts.sql`.
- `/tests/session_isolation.py`.

Las rutas son relativas a `/Dot63_v1`. También respondió 200 `/controller/uploads/`. HEAD confirma accesibilidad de esas rutas, no una extracción completa del repositorio ni la ejecución de archivos subidos.

Además, `controller/config/database.php:22` contiene una credencial alternativa de producción escrita en el código, y `controller/emails/send_emails.php:321` contiene una contraseña SMTP alternativa no vacía. Ambos archivos están versionados. No se verificó si las credenciales siguen vigentes. El fallback local utiliza `root` sin contraseña (`controller/config/database.php:28`), por lo que no es adecuado como configuración de producción.

**Corrección:** bloquear inmediatamente el acceso web a `.git`, SQL, tests, configuración privada y registros; desactivar listado de directorios. Rotar las credenciales que puedan seguir activas, quitarlas del código y utilizar configuración privada por entorno. Borrar una contraseña del último commit no la elimina del historial. Usar una cuenta de BD con permisos mínimos.

### 6. Protecciones de sesión y CSRF inconsistentes

**Prioridad: alta. Severidad: media a alta según la operación. Evidencia: código y cabeceras locales.**

Clientes y checkout configuran modo estricto, `HttpOnly` y `SameSite=Lax`. El login de proveedores usa `session_start()` sin esa configuración (`controller/users/login.php:93`). La configuración PHP local deja desactivado el modo estricto y vacíos `session.cookie_httponly` y `session.cookie_samesite`.

La respuesta anónima de aprobación de Promoflow creó una cookie sin `HttpOnly` ni `SameSite`; la respuesta del checkout sí incluyó ambos. No se considera fallo la ausencia de `Secure` en esta prueba local realizada mediante HTTP.

El checkout valida CSRF (`controller/order/stripe_checkout.php:43`), pero las rutas revisadas de perfil, catálogo y carrito no aplican un control equivalente. Varias aceptan formularios o leen JSON sin exigir su tipo de contenido; por ello no debe suponerse que usar JSON impide peticiones desde otros sitios. El impacto CSRF concreto depende también del alcance y atributos de la cookie.

No se encontró limitación de intentos implementada en los controladores de login revisados. Podría existir en infraestructura no auditada.

**Corrección:** configuración común de sesiones antes de cualquier `session_start()`, tokens CSRF para operaciones con cookies que cambian datos, métodos y tipos de contenido explícitos, límites de intentos por cuenta/IP y expiración/revocación de sesiones. Revisar el uso compartido de cookies entre Dot63 y Promoflow.

### 7. PHP local fuera de soporte

**Prioridad: alta antes del despliegue. Severidad: alta si se replica este entorno. Evidencia: CLI y cabecera HTTP.**

El PHP instalado y anunciado por Apache es **8.0.28**. PHP 8.0 terminó su soporte el **26 de noviembre de 2023**, según la [tabla oficial de PHP](https://www.php.net/eol.php). No se ha comprobado la versión del servidor de producción.

Se inventariaron Stripe PHP 16.5.0, PHPMailer 6.8.1 y las dependencias copiadas de Ratchet. No se realizó una consulta exhaustiva de vulnerabilidades de todos esos paquetes; su antigüedad por sí sola no se presenta como una vulnerabilidad demostrada.

**Corrección:** migrar y probar sobre una rama de PHP con soporte, inventariar también bibliotecas copiadas manualmente y aplicar un proceso regular de auditoría y actualización de dependencias.

## Observaciones adicionales

- **Salida HTML pendiente de verificar en navegador:** `view/product_list/product_list/product_list.js:141` inserta SKU y nombre con `innerHTML` sin escape; `model/product_status.php:74` conserva texto recibido para el nombre. Existe un punto de inyección HTML con riesgo de XSS almacenado en esa vista. No se introdujo un payload ni se probó su alcance entre usuarios. Usar `textContent` o escape contextual. Las vistas nuevas revisadas ya aplican `textContent` en muchos lugares.
- **Propiedad del carrito frágil:** `model/jobs.php:60` y `model/checkout_payments.php:399` identifican el carrito mediante un correo dentro de `notes`. Conviene migrarlo a `customer_id` con relación explícita. El controlador actual del carrito exige sesión de cliente: no se confirma como vigente la mezcla de carritos de cliente/proveedor descrita en el plan anterior.
- **Cabeceras:** la respuesta HTTP local de la raíz no incluyó CSP, protección contra framing o `nosniff`. El checkout sí incluye `nosniff`. Revisar la política de cabeceras y HTTPS en el despliegue real; estas medidas complementan los permisos, no los sustituyen.

## Controles que sí están presentes

- Contraseñas tratadas con `password_hash` / `password_verify`; regeneración de ID de sesión al iniciar sesión.
- Uso frecuente de parámetros en consultas PDO. No se confirmó una inyección SQL en los flujos revisados, sin afirmar que se haya descartado en todo el proyecto.
- Checkout: sesión de cliente, CSRF, comprobación de propietario de dirección/pedido, firma de webhook mediante el SDK de Stripe, comprobación de importe y moneda, transacciones y registro de eventos repetidos. Evidencia: `controller/order/stripe_checkout.php:29`, `controller/order/stripe_webhook.php:42`, `model/checkout_payments.php:167`.
- La API local de checkout devolvió HTTP 401 al consultar el estado de un pedido sin sesión.
- Publicación y edición de detalles usan `supplierEmail()` y `ProductStatus::getOwned()`. Las aprobaciones de Promoflow actualmente exigen sesión y rechazaron con HTTP 401 una petición anónima. No corresponde describirlas como anónimas basándose en el plan antiguo.

## Orden de corrección y criterios de aceptación

1. **Cerrar exposición inmediata:** proteger subidas y rutas de escritura; bloquear archivos internos; rotar secretos activos. Verificar que visitantes no modifican BD/archivos y que SQL y `.git` devuelven 403/404.
2. **Unificar identidad y permisos:** IDs obtenidos de sesión, propiedad obligatoria por operación y consultas privadas autorizadas. Probar que el proveedor A no lee ni modifica recursos privados de B, incluidos precios e imágenes.
3. **Sesiones, CSRF y salida segura:** comprobar peticiones sin token, cookies consistentes, rechazo de intentos excesivos y texto HTML mostrado como texto.
4. **Entorno y regresión:** PHP soportado, dependencias auditadas, configuración del alojamiento y pruebas en BD exclusiva de pruebas. Mantener los controles de Stripe y probar reintentos, eventos firmados inválidos y conservación de pedidos pagados.

El [plan de seguridad existente](PLAN_SEGURIDAD.md) ofrece una base de implementación, pero sigue siendo una propuesta y algunas observaciones ya no representan el código actual. La protección debe comprobarse en cada ruta real. OWASP recomienda [autorizar cada petición y recurso](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) y [validar y aislar las subidas mediante varias capas](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), criterios usados para esta revisión.
