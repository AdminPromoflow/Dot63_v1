# Recuperación de contraseña de Dot63

La página `view/forg_password/index.php?account=customer` recupera cuentas de clientes; con `account=supplier` recupera proveedores. Los enlaces están en los dos logins y en los diálogos de acceso de clientes de la portada y del detalle de producto.

## Instalación

1. Ejecutar **solo** `controller/config/migrations/20261027_add_password_recovery.sql` en la base de datos de la instalación. La migración es aditiva e idempotente. El archivo completo `mySQL.sql` es para reconstrucciones y elimina tablas existentes.
2. Configurar `DOT63_PUBLIC_URL` con la URL pública HTTPS de la instalación, incluyendo su subdirectorio si existe. El valor predeterminado es `https://lanyardsforyou.com`. Para desarrollo se admite una URL local HTTP.
3. Configurar las variables SMTP del servicio de correo existente: `DOT63_SMTP_HOST`, `DOT63_SMTP_PORT`, `DOT63_SMTP_USERNAME`, `DOT63_SMTP_PASSWORD`, `DOT63_SMTP_FROM_EMAIL` y `DOT63_SMTP_FROM_NAME`. Usa STARTTLS. `.env.example` documenta las variables; la aplicación no carga un archivo `.env` automáticamente.
4. Comprobar las credenciales de base de datos en el entorno PHP o en `controller/config/database.local.php`.

La migración se aplicó a `dot63` local durante el desarrollo. La configuración local existente apuntaba a `u273173398_dot63` y devolvía acceso denegado. Se conservó ese archivo; las pruebas usaron variables explícitas y una base temporal. No se verificó entrega a un buzón real.

## Comportamiento

- Enlaces aleatorios de 256 bits, vigentes durante 30 minutos y utilizables una sola vez. La base guarda únicamente su hash SHA-256.
- El token viaja en el fragmento `#token=...` del enlace, fuera de los registros HTTP y del Referer. JavaScript lo envía al controlador en el cuerpo POST.
- Customer y supplier se mantienen separados, incluso cuando comparten correo o identificador. Un nuevo enlace reemplaza al anterior del mismo tipo de cuenta. Cambiar la contraseña invalida los enlaces pendientes.
- Límites persistentes de 3 solicitudes por tipo de cuenta/correo y 10 por dirección IP en 15 minutos. Se cuentan también correos inexistentes; no se confía en cabeceras de IP reenviadas.
- Las respuestas públicas no revelan si existe una cuenta ni si falló el correo. Los fallos SMTP se registran en el log de PHP y se elimina el token correspondiente.
- Todas las acciones exigen POST y CSRF. La contraseña debe cumplir la política del registro de clientes y coincidir con su confirmación.
- El cambio de contraseña y la eliminación del token se ejecutan en una transacción con bloqueos. Consultar el enlace no lo consume. Tras restablecer la contraseña se vuelve al login, sin inicio automático de sesión.
- Las sesiones ya iniciadas conservan el comportamiento actual de la aplicación; este cambio no incorpora revocación global de sesiones.

## Verificación

```sh
/Applications/XAMPP/xamppfiles/bin/php tests/password_recovery_integration.php
/Applications/XAMPP/xamppfiles/bin/php tests/email_notifications.php
node --check view/forg_password/password/password.js
```

La prueba de integración requiere MySQL local con el esquema `dot63`; clona únicamente las estructuras de customers y suppliers en una base temporal que elimina al terminar. Verifica ambos roles, contraseñas anteriores/nuevas, CSRF, validación, expiración, reutilización, límites y errores de envío. No cambia cuentas existentes ni envía correos reales. Las pruebas de correo verifican contenido, destinatario y URL mediante un transporte simulado.
