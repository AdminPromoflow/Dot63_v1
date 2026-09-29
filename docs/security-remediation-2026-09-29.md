# Correcciones de seguridad — Dot63

Fecha: 29 de septiembre de 2026. Alcance: código de esta copia y Apache local en `http://localhost/Dot63_v1/`. No se ha desplegado ni verificado el servidor de producción.

## Estado de los hallazgos

| Hallazgo | Resultado |
| --- | --- |
| F01 — Carga de archivos ejecutables | Corregido en local. Autenticación, propiedad del producto y CSRF antes de cargar. Validación de contenido/MIME, extensión y tamaño; nombres aleatorios; prohibición de ejecutar archivos en los directorios de carga. |
| F02 — Modificación del catálogo sin autorización | Corregido. Lista explícita de acciones permitidas y comprobación de propiedad de productos, variaciones, precios e ítems. También se rechazan referencias que mezclen productos, aunque pertenezcan al mismo proveedor. |
| F03 — Exposición de Git y directorios internos | Corregido en Apache local. Git, configuración, pruebas y listados de cargas devuelven 403. Las pruebas PHP también rechazan ejecución HTTP cuando se usa el servidor integrado de PHP. |
| F04 — Credenciales de base de datos y SMTP en código | Mitigado, pendiente de rotación. Se eliminaron las contraseñas incrustadas de la configuración actual y se exigen variables del entorno en el alojamiento. Los secretos anteriores siguen comprometidos y deben revocarse en el proveedor; no se reescribió el historial Git. |
| F05 — Actualización del perfil de otro proveedor | Corregido. El proveedor se obtiene exclusivamente de la sesión, y la modificación requiere CSRF. El correo enviado en el cuerpo no selecciona la cuenta que se modifica. |
| F06 — XSS almacenado en categorías, grupos e ítems | Corregidos los puntos detectados usando nodos DOM, `textContent` y valores de controles. También se corrigieron la lista de productos y los atributos de miniaturas. |
| F07 — Lectura pública de datos internos de Promoflow | Corregido. Se exige la sesión interna antes de despachar cualquier acción. Las modificaciones requieren CSRF. Se adaptó el proxy del proyecto Promoflow para transmitir el token y comprobar su propia sesión. |
| F08 — Cookies y cabeceras insuficientes | Corregido en la aplicación. Sesión estricta, cookies HttpOnly y SameSite=Lax, Secure bajo HTTPS; cabeceras nosniff, SAMEORIGIN, política de referente, permisos y CSP básica. Se añadió transporte de CSRF para las peticiones del frontend. |
| F09 — PHP sin soporte | Pendiente. PHP 8.4.26 está instalado, pero Apache sigue usando PHP 8.0.28. La solicitud de ejecutar la integración con PHP 8.4 fue rechazada por el usuario; no se activó ese runtime ni se modificó el servicio de Apache. |

La CSP aplicada limita objetos, marcos y URL base; no es una política estricta de scripts. La corrección de XSS depende del tratamiento seguro de los datos en los puntos revisados, no de que CSP bloquee todo script.

## Validación realizada

- `tests/security_integration.php`: **85 comprobaciones aprobadas con el PHP de XAMPP**. Se crea una base temporal con el esquema local y datos sintéticos, y se elimina al terminar. Verifica autenticación, CSRF, propiedad, referencias cruzadas, edición autorizada, rechazo de cargas peligrosas, aceptación de PNG válido y acceso al catálogo público.
- `tests/security_frontend.cjs`: pruebas de renderizado seguro para categorías, grupos e ítems y **6 escenarios de transporte CSRF** aprobados. Incluyen solicitudes simultáneas, peticiones externas y ausencia de reenvío automático de modificaciones.
- `tests/email_notifications.php`: aprobado con envío simulado; no envía correos reales.
- Sintaxis PHP: **125 archivos, cero errores**, incluido el proxy modificado de Promoflow. `git diff --check` sin errores.
- HTTP contra Apache: portada 200, Git y directorios protegidos 403, endpoints internos sin sesión 401, cookies HttpOnly/SameSite y cabeceras de seguridad presentes en las respuestas de la aplicación.
- Navegador: catálogo visible sin errores de JavaScript registrados. La base local contiene cero productos aprobados y muestra el estado vacío correspondiente.
- Permisos locales: se verificó que Apache puede crear una carpeta de carga. Se retiraron el endpoint y la carpeta temporales de esta comprobación.

No se ha realizado una validación completa de producción, un envío SMTP real, pagos reales ni una prueba completa de los flujos autenticados entre ambos sitios. La suite `customer_auth_integration.php` se adaptó al CSRF del cierre de sesión, pero no se ejecutó en esta intervención.

## Pendientes para cerrar la remediación

1. **Rotar las credenciales expuestas de MySQL y SMTP en el proveedor.** Configurar las nuevas mediante las variables `DOT63_DB_*` y `DOT63_SMTP_*` descritas en `.env.example`. Ese archivo es documentación y no se carga automáticamente. La aplicación requiere que el servidor configure las variables. El envío de correo queda deshabilitado si `DOT63_SMTP_PASSWORD` no está definido.
2. **Validar y activar PHP 8.4 para el sitio.** Está disponible en `/opt/homebrew/opt/php@8.4/bin/php`. Antes de cambiar Apache deben probarse las extensiones, la integración y las sesiones compartidas con Promoflow. Instalar PHP no cambia por sí solo la versión que sirve la web.
3. Al desplegar estas correcciones, incluir los archivos ocultos `.htaccess` y `.user.ini` y comprobar de nuevo los bloqueos HTTP, cookies HTTPS y permisos de cargas en ese servidor. Los bloqueos de Apache necesitan que el alojamiento permita sus directivas.

## Archivos y configuración relevantes

- `controller/security/`: controles compartidos de sesión, CSRF, autorización y cargas.
- `view/global/security/`: integración del token en las peticiones del frontend.
- `.htaccess`, `.user.ini` y los `.htaccess` de cargas: protecciones HTTP y de ejecución.
- `controller/config/database.php` y `controller/emails/send_emails.php`: configuración desde el entorno.
- Proyecto relacionado: `../Promoflow_v1/controller/dot63/requests_63_api.php`.
- Permiso específico de este Mac, no almacenado en Git: ACL de `controller/uploads` para que el usuario Apache `daemon` pueda listar, recorrer y crear subdirectorios. No se concedió escritura global ni modificación de su `.htaccess`. En otro servidor se debe configurar el permiso equivalente para su usuario web.

Las correcciones y las pruebas cubren los hallazgos identificados; no certifican que toda la aplicación esté libre de vulnerabilidades.
