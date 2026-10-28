# Informe de seguridad de Dot63 — Español

Fecha: **5 de octubre de 2026**. Código revisado: copia local de Dot63, commit `f18c867`; árbol de trabajo limpio al comenzar. Se inspeccionó también la integración pertinente de la copia local de Promoflow. No se modificó código funcional, configuración ni el sitio publicado.

## Resumen para personas no técnicas

**Dot63 ya tiene medidas reales de seguridad:** protege las contraseñas, exige identificación para modificar productos y perfiles, comprueba a quién pertenece la información, revisa los archivos subidos y verifica las confirmaciones de Stripe. Las pruebas actuales confirmaron que muchas de estas barreras funcionan.

**La protección todavía tiene huecos importantes.** El más urgente está en la relación entre el carrito y el pago: en una prueba simulada se preparó un pago de £19.50 para dos unidades, se aumentó después la cantidad a veinte y el sistema dejó esas veinte unidades como pedidas con el pago original. También se pudieron consultar datos de un producto en borrador por rutas antiguas y registrar un proveedor con una contraseña de un solo carácter. Los documentos de clientes se sirven mediante un enlace que no exige iniciar sesión.

En la mensajería con Promoflow hay, además, controles de acceso ausentes en el código del receptor. Su efecto en internet depende de qué versión esté instalada y de posibles restricciones del servidor. Esto no significa que se haya demostrado una intrusión o una pérdida de datos.

El usuario confirma que Dot63 está publicada. **Esta auditoría revisa el código disponible y pruebas locales; no demuestra que ese código sea idéntico al desplegado.** Por ello, las protecciones y problemas verificados aquí no se atribuyen automáticamente al servidor público.

## Protecciones existentes comprobadas

| Área | Protección que ya existe | Evidencia y límite |
| --- | --- | --- |
| Contraseñas | Clientes y proveedores usan `password_hash` y `password_verify`; no se guardan como texto legible. El cliente actualiza el hash cuando corresponde. | [Clientes][customer-hash], [proveedores][supplier-hash]. El registro de clientes comprueba formato, longitud y complejidad; el de proveedores no aplica controles equivalentes. |
| Sesiones | Se renueva el identificador al entrar y salir. Cookies HttpOnly y SameSite=Lax; modo estricto; Secure cuando PHP detecta HTTPS. Clientes y proveedores usan indicadores de identidad separados. | [Configuración común][sessions], [login de clientes][customer-login], [login de proveedores][supplier-login]. HttpOnly/SameSite se observaron en Apache local. HTTPS de producción no fue comprobado. |
| Catálogo y perfiles | Las operaciones de edición exigen sesión de proveedor, propiedad del producto y coherencia entre producto, variación, precio e ítem. El perfil se selecciona desde la sesión, no desde el correo enviado por el navegador. | [Permisos][permissions], [perfil][profile]. La suite de seguridad aprobó 85 comprobaciones; no cubre todas las rutas antiguas de lectura. |
| Cambios solicitados desde el navegador | Las modificaciones protegidas requieren POST y un token aleatorio de sesión, comparado de forma segura. El navegador no envía ese token a otros sitios. | [Servidor][csrf], [navegador][csrf-browser], [carrito][cart-controller]. Protección CSRF comprobada para los flujos de la suite; no es una barrera universal para todas las rutas del proyecto. |
| Archivos subidos | Se comprueban extensión, tipo real, tamaño máximo de 8 MB y dimensiones de imágenes; se usan nombres aleatorios. Apache bloquea formatos ejecutables y los PDF se descargan como adjuntos. | [Validación][uploads], [reglas de carpetas][upload-rules]. Pasaron las pruebas de imágenes y 44 comprobaciones de PDF. No se encontró análisis antivirus; validar MIME no demuestra que un PDF sea inocuo. |
| Datos mostrados y consultas | Los puntos revisados usan consultas con parámetros y representación segura de texto. Las pruebas de categorías, grupos e ítems comprobaron que el contenido de prueba permanece como texto. | [Pruebas de interfaz][frontend-test], [consultas de cuentas][customer-hash]. No se confirmó una inyección SQL ni una nueva ejecución de scripts en las vistas actuales; tampoco se descartan en todo el sistema. |
| Pedidos y Stripe | Precios del carrito calculados en el servidor; comprobación de propiedad de direcciones y pedidos; firma del webhook; importe y moneda; transacciones y prevención de eventos duplicados. | [Precios][cart-pricing], [dirección y pedido][order-prepare], [propiedad][order-owner], [firma][webhook], [eventos][payment-replay]. Hay una excepción importante de coherencia del carrito descrita en H01. |
| Aprobaciones y avisos | Los cambios de estado pasan por revisión y control de versión para rechazar aprobaciones antiguas. La API de aprobación exige sesión interna; las modificaciones incluyen CSRF. Los avisos de pedidos se preparan solo después de registrar el pago y separan los pedidos por destinatario. | [Revisión][status-review], [API][promo-approval], [proxy][promo-proxy], [avisos][notifications]. Se probaron avisos simulados; la integración completa de aprobación no quedó validada por una prueba desactualizada. |
| Archivos internos y configuración | Apache bloquea Git, configuración, pruebas y listados de cargas. Hay cabeceras contra interpretación incorrecta de archivos y uso de la página dentro de marcos ajenos. BD y Stripe admiten configuración privada; SMTP exige una contraseña configurada. | [Reglas HTTP][http-rules], [BD][db-config], [Stripe][stripe-config], [SMTP][smtp-config]. Los cuatro accesos locales comprobados devolvieron 403. La política CSP es básica, no restringe todos los scripts. |

## Hallazgos y prioridades

Las prioridades indican orden de atención e impacto posible; no son una puntuación ni una certificación. “Confirmado localmente” significa reproducción con datos sintéticos. “Confirmado en código” significa que se trazó la ruta afectada sin ejecutarla contra datos reales.

### H01 — Cantidades modificables después de preparar el pago

**Prioridad alta. Confirmado localmente en la lógica del servidor.**

El pedido guarda un importe y asocia los trabajos del carrito, pero estos siguen en estado `cart`. `updateCartItem` permite modificar su cantidad y subtotal. Cuando llega la confirmación, se compara el importe recibido con el total del pedido y se marcan como `ordered` los trabajos asociados, sin comprobar que conserven las cantidades y los importes originales.

**Resultado reproducido:** pago simulado de £19.50; cambio de 2 a 20 unidades aceptado; subtotal del trabajo £195.00; pedido `paid` y trabajo `ordered`. Se usaron los modelos reales, un cliente Stripe simulado y una base desechable. No hubo cobro, llamada a Stripe ni falsificación de una firma válida. La comprobación de propiedad de otro pedido sí rechazó el acceso con 404.

**Impacto:** un pedido puede terminar con mercancía por un importe superior al pagado, si el flujo desplegado conserva esta lógica. **Recomendación:** fijar una copia inmutable de las líneas al preparar el pago o invalidar y recalcular el intento cuando cambia el carrito; verificar también esas líneas al confirmar el pago.

Evidencia: [asociación de trabajos][order-link], [edición del carrito][cart-update], [confirmación del pago][payment-confirm].

### H02 — Mensajería de Promoflow sin autorización en el receptor

**Prioridad alta. Confirmado en el código de la integración; exposición pública no verificada.**

Dot63 exige una sesión de proveedor al enviar peticiones, pero el receptor de la copia local de Promoflow despacha acciones sin verificar sesión o credencial de integración. El modelo lista todos los casos y obtiene mensajes por el identificador recibido, sin comprobar propiedad. La escritura también acepta la identidad del remitente recibida en la petición.

**Impacto:** si ese receptor está desplegado y es accesible, permitiría consultar conversaciones o insertar mensajes sin los permisos adecuados. La protección de la API de aprobación no protege automáticamente este otro receptor. **Recomendación:** autenticar la comunicación entre servicios y comprobar pertenencia del caso en cada lectura y escritura, tomando la identidad de una fuente validada.

Evidencia: [emisor Dot63][promo-sender], [receptor Promoflow][promo-receiver], [consultas de casos y mensajes][promo-messages], [escritura de mensajes][promo-message-write]. No se enviaron mensajes ni se consultaron conversaciones reales.

### H03 — Rutas antiguas revelan productos en borrador

**Prioridad media. Confirmado localmente por HTTP sin iniciar sesión.**

La ruta moderna `get_customer_preview` rechazó un borrador sintético con 404, mientras `get_preview_product_details` devolvió sus datos con 200. `get_variation_children_by_id` también devolvió información de ese borrador, incluido su precio de prueba. Las consultas antiguas no aplican el filtro de publicación ni la autorización de las rutas modernas.

**Impacto:** exposición de información comercial todavía no publicada para quien conozca los identificadores. **Recomendación:** retirar estas acciones antiguas o aplicarles los mismos controles de publicación y propiedad.

Evidencia: [despacho de acciones antiguas][legacy-dispatch], [consulta por SKU sin filtro de publicación][legacy-product], [consultas de variaciones][legacy-variations].

### H04 — PDF de clientes accesibles a quien tenga el enlace

**Prioridad media; mayor si los documentos son confidenciales. Comportamiento confirmado en Apache local.**

Los PDF se guardan bajo la carpeta pública del sitio. Se comprobó un documento sintético creado para esta revisión: una petición anónima HEAD a su URL devolvió 200. Las reglas fuerzan la descarga pero no validan al propietario. Los correos incluyen enlaces directos.

Los nombres aleatorios dificultan adivinar una URL; no impiden que un enlace compartido o filtrado permita acceso. No se descargó ningún documento de un cliente real ni se afirma que se puedan enumerar todos los archivos.

**Recomendación:** si estos archivos deben ser privados, servirlos mediante una descarga que compruebe permisos o enlaces firmados que caduquen, almacenándolos fuera de la carpeta pública.

Evidencia: [almacenamiento][upload-store], [reglas de PDF][pdf-rules], [enlaces por correo][pdf-email].

### H05 — Registro de proveedores acepta contraseñas muy débiles

**Prioridad media. Confirmado localmente.**

Una petición directa al registro creó una cuenta sintética con contraseña de un carácter; se comprobó que el hash guardado correspondía a ella. El servidor del registro de proveedores no aplica la política que sí existe para clientes. Tampoco se encontró limitación de intentos en los dos controladores de acceso revisados. No se comprobó si el alojamiento impone una limitación externa.

**Impacto:** facilita cuentas débiles y los intentos automatizados de adivinar contraseñas. **Recomendación:** validar también en el servidor el registro de proveedores y limitar intentos por cuenta y origen; considerar un segundo factor para cuentas con permisos de revisión.

Evidencia: [registro][supplier-register], [modelo de proveedores][supplier-hash], [validación de clientes][customer-validation], [acceso de clientes][customer-login], [acceso de proveedores][supplier-login].

### H06 — Claves expuestas anteriormente: sustitución sin confirmar

**Prioridad alta de verificación operativa. No se confirmó que las claves antiguas sigan activas.**

El informe anterior documentó credenciales de BD y correo incluidas en código y pendientes de sustitución. La configuración actual evita esas contraseñas por defecto y los archivos locales de secretos están excluidos de Git. Una búsqueda limitada de patrones en código actual no detectó literales de esos tipos. Esto no prueba que las claves antiguas hayan sido revocadas ni que el historial carezca de secretos.

**Recomendación:** confirmar en los proveedores que se revocaron las credenciales antiguas y se configuraron nuevas; revisar accesos y permisos. No se intentó autenticar con claves antiguas, ni se volcaron sus valores.

Evidencia: [antecedente documentado][prior], [configuración actual de BD][db-config], [configuración actual de SMTP][smtp-config].

### H07 — El servidor local sigue usando PHP sin soporte

**Prioridad alta para actualizar el entorno afectado. Confirmado localmente; versión de producción desconocida.**

Apache local anunció PHP 8.0.28 durante esta revisión. PHP 8.0 terminó su soporte oficial el 26 de noviembre de 2023. No se comprobó una explotación concreta del runtime. **Recomendación:** actualizar y validar una rama soportada, y comprobar por separado la versión que usa el sitio publicado. [Tabla oficial de PHP](https://www.php.net/eol.php).

### H08 — Recuperación de contraseña incompleta

**Prioridad media para completar la gestión de cuentas. Confirmado en código; no se demuestra una toma de cuenta.**

La pantalla de recuperación muestra un campo de correo, pero su JavaScript intenta leer un campo de contraseña ausente y enviar una acción de login no admitida por el controlador de proveedores. No se encontró un flujo de recuperación con token de un solo uso y caducidad en los controladores revisados.

**Impacto:** usuarios sin contraseña pueden quedar sin una recuperación funcional y depender de procedimientos manuales. **Recomendación:** implementar y probar un flujo de recuperación por correo con respuesta genérica, token temporal de un solo uso y límites de intentos.

Evidencia: [pantalla][recovery-view], [JavaScript][recovery-js], [controlador][supplier-login].

## Límites adicionales de las protecciones

- La identidad de los carritos se obtiene de un correo dentro del campo de notas, aunque procede de la sesión. Sería más robusto vincularlos por `customer_id`. No se reprodujo acceso cruzado por este mecanismo. [Consulta de propiedad][cart-owner].
- No se encontró una expiración por inactividad o duración máxima impuesta por la aplicación, ni doble factor o confirmación obligatoria de correo en los flujos revisados. PHP tiene mecanismos de limpieza de sesiones; no equivalen a una política completa de revocación. El acceso de revisión se basa en la sesión interna de Promoflow, sin un rol de revisor independiente en ese control. [Sesiones y revisión][sessions].
- La CSP limita marcos, objetos y URL base, pero no restringe la ejecución general de scripts. Hay copias antiguas de JavaScript con interpolación HTML; el índice de la copia antigua inspeccionada incluye la vista moderna. No se presentó ese código residual como una vulnerabilidad XSS activa demostrada. [Reglas][http-rules], [índice antiguo][legacy-view].
- Las cargas de imágenes tienen validación y permisos, pero si falla su registro en BD pueden quedar archivos huérfanos. La carga de PDF de pedidos sí incluye limpieza por fallo de transacción. No se probó agotamiento de almacenamiento.

## Pruebas efectuadas y resultados

Las pruebas se inspeccionaron antes de ejecutarlas. Para las que normalmente usan la BD configurada se creó una base local vacía con copia del esquema y se fijaron explícitamente host, puerto, usuario y nombre de prueba. Se desactivó SMTP; Stripe fue sustituido por objetos simulados. Las bases, sesiones y archivos sintéticos se eliminaron al finalizar. No se copiaron datos de negocio ni se probaron cambios en producción.

| Comprobación | Resultado actual |
| --- | --- |
| [Integración de seguridad][security-test] | 85 comprobaciones aprobadas: autenticación, CSRF, propiedad, referencias cruzadas, cambios autorizados, imágenes y catálogo público. |
| [Carga de PDF de pedidos][artwork-test] | 44 comprobaciones aprobadas: sesión, token, tamaños, tipos falsificados, archivos opcionales y reversión por error. |
| [Interfaz de seguridad][frontend-test] | 6 escenarios aprobados, incluyendo renderizado seguro, token solo al mismo origen, concurrencia y ausencia de repetición automática de modificaciones. |
| [Configuración de BD][config-test] | 24 comprobaciones aprobadas, sin escrituras en BD. |
| [Correos][email-test] | Aprobado con entrega sustituida: escape de contenido, destinatarios y enlaces. No envía correos reales. |
| [Registro y acceso de clientes][auth-test] | Aprobado en BD desechable: validación, duplicados, hash, dirección, sesión, logout y reversión si falla la dirección. |
| [Checkout Stripe][stripe-test] | Aprobado con Stripe simulado: importe, eventos repetidos, estado pagado y reintentos de notificación. No detectaba H01; se añadió una comprobación separada para esta auditoría. |
| [Notificaciones de pedidos][notice-test] | Aprobado con destinatarios y entregas simulados: aislamiento, duplicados y reintentos. |
| Firma de Stripe, prueba local del SDK | 3 comprobaciones aprobadas: firma válida, rechazo de firma alterada y rechazo de fecha caducada. No es una entrega real del webhook de producción. |
| [Integración de estados][status-test] | Falló en la lectura de cola: la prueba espera 200 sin sesión y el código actual exige autenticación. No se declara aprobada la suite ni la parte posterior del flujo HTTP. No se cambió la prueba. |
| Comprobaciones adicionales con datos sintéticos | Confirmaron H01, H03, H04 y H05; rechazaron la consulta de un pedido de otro cliente con 404. |
| Apache local | Catálogo 200; Git, SQL de configuración, prueba PHP y listado de cargas 403; cabeceras de seguridad y cookies HttpOnly/SameSite presentes. |
| Sintaxis PHP | 148 archivos de aplicación/pruebas fuera de `controller/assets`, sin errores. No equivale a comprobar seguridad lógica. |

Los mensajes de error de dirección y de entrega de correo en las suites correspondientes fueron fallos simulados intencionales: las pruebas verificaron la reversión y el reintento. Las denegaciones iniciales del aislamiento del entorno se resolvieron con autorización y las ejecuciones indicadas arriba se completaron; no quedan resultados atribuidos a ejecuciones bloqueadas.

## Dependencias y cobertura pendiente

Se inventariaron, entre otras, Stripe PHP **16.5.0**, PHPMailer **6.8.1**, Ratchet **0.4.4**, Symfony HttpFoundation **5.4.50**, Symfony Routing **5.4.53** y Guzzle PSR-7 **2.12.3**. [Stripe][dependencies], [dependencias de Ratchet][ratchet-deps], [PHPMailer][mailer-version]. Se consultaron avisos oficiales de [PHPMailer](https://github.com/PHPMailer/PHPMailer/security) y la [publicación de Symfony 5.4.50](https://symfony.com/blog/symfony-5-4-50-released); esta última ya incluye una corrección de HttpFoundation. La presencia de estas versiones no se presenta como una vulnerabilidad explotable confirmada. No se completó una auditoría automatizada exhaustiva de avisos, dependencias transitivas ni uso efectivo de Ratchet.

La documentación señala una instalación en `promoflow.net/dot63/`, mientras la configuración de correos utiliza por defecto `lanyardsforyou.com`. [Registro del alojamiento][hosting], [origen de enlaces][public-url]. Al no confirmar cuál es el destino público actual de esta revisión, no se realizaron comprobaciones externas sobre ninguno. La auditoría local continuó sin bloquearse por esa ambigüedad.

Queda por verificar en el sitio publicado: correspondencia con este código, HTTPS y redirecciones, cookies detrás de posibles proxies, reglas `.htaccess`, permisos y privilegios de BD, revocación de claves, firewall o limitación externa, copias de respaldo y restauración, registros de acceso, versión de PHP, configuración real de Stripe y correo, y restricciones del receptor de mensajería. No hubo pruebas destructivas, cobros, correos reales, lectura de conversaciones reales ni análisis de incidentes. Esta revisión no certifica ausencia de vulnerabilidades.


[customer-hash]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/customers.php:45
[supplier-hash]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/users.php:168
[customer-validation]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/customers/sing_up.php:103
[supplier-register]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/users/sign_up.php:17
[customer-login]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/customers/login.php:50
[supplier-login]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/users/login.php:58
[sessions]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/bootstrap.php:5
[csrf]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/bootstrap.php:51
[csrf-browser]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/global/security/request_security.js:14
[permissions]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/catalog_access.php:60
[profile]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/users/supplier_info.php:57
[uploads]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/uploads.php:9
[upload-store]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/uploads.php:52
[upload-rules]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/uploads/.htaccess:1
[pdf-rules]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/uploads/job-artworks/.htaccess:1
[pdf-email]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/emails/send_emails.php:312
[http-rules]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/.htaccess:1
[db-config]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/config/database_config.php:7
[smtp-config]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/emails/send_emails.php:407
[stripe-config]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/config/stripe.php:17
[cart-controller]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/cart.php:44
[cart-pricing]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/jobs.php:14
[cart-update]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/jobs.php:277
[cart-owner]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/jobs.php:746
[order-prepare]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:368
[order-link]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:511
[order-owner]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:129
[payment-confirm]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:225
[payment-replay]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:167
[webhook]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/stripe_webhook.php:38
[notifications]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/order_notifications.php:19
[status-review]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/product_status.php:60
[legacy-dispatch]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/product.php:52
[legacy-product]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/products.php:1061
[legacy-variations]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/product.php:713
[promo-approval]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/promoflow/promoflow_webhook.php:20
[promo-sender]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/promoflow/requests_Promoflow_api.php:25
[promo-receiver]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/controller/dot63/promoflow_webhook.php:20
[promo-messages]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/model/message.php:259
[promo-message-write]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/controller/dot63/promoflow_webhook.php:91
[promo-proxy]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/controller/dot63/requests_63_api.php:37
[recovery-js]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/forg_password/password/password.js:8
[recovery-view]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/forg_password/password/password.php:8
[legacy-view]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/preview_product_customers_/index.php:37
[prior]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/docs/security-remediation-2026-09-29.md:1
[hosting]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/docs/hostinger-templates-2026-09-29.md:5
[public-url]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/emails/send_emails.php:348
[status-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/product_status_integration.php:170
[security-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/security_integration.php:1
[frontend-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/security_frontend.cjs:1
[artwork-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/artwork_upload_integration.php:1
[auth-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/customer_auth_integration.php:1
[stripe-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/stripe_checkout_integration.php:1
[notice-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/order_notifications_integration.php:1
[config-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/database_configuration.php:1
[email-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/email_notifications.php:1
[dependencies]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/assets/vendor/composer/installed.json:1
[ratchet-deps]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/assets/lib/ratcher/vendor/composer/installed.json:1
[mailer-version]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/assets/lib/send-email/PHPMailer/VERSION:1
