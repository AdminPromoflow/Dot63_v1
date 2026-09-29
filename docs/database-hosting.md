# Conexión MySQL en el hosting

El error `Dot63 database credentials are not configured` significa que PHP no recibe
los datos de conexión. Los errores posteriores `prepare() on null` o `PDO, null given`
son consecuencias de esa conexión ausente. Las entradas de agosto de 2025 sobre
`saveOrder` son anteriores y no explican el fallo del catálogo del 29 de septiembre de 2026.

## Configurar mediante un archivo PHP

1. Subir `controller/config/database.php`, `database_config.php` y
   `database.local.example.php` de esta versión al servidor.
2. En el administrador de archivos del hosting, copiar `database.local.example.php`
   como `database.local.php` en la misma carpeta.
3. Completar `host`, `name`, `user` y `password` con los datos MySQL del panel del hosting.
   La plantilla incluye la base `u273173398_dot63` y el usuario `u273173398_test`
   facilitados para este despliegue; completar la contraseña real solamente en el hosting.
   Usar el nombre completo de la base y del usuario, incluidos sus prefijos.
   El host es el servidor MySQL que indique el proveedor, no la URL del sitio.
   Mantener `port` en 3306 salvo que el proveedor indique otro puerto.
4. Al usar este archivo, retirar de `.htaccess` únicamente las cuatro líneas
   `SetEnv DOT63_DB_HOST`, `SetEnv DOT63_DB_NAME`, `SetEnv DOT63_DB_USER` y
   `SetEnv DOT63_DB_PASSWORD` para evitar que valores parciales anulen el archivo.
   Conservar la protección PHP al principio del archivo y el resto del `.htaccess`.
   El archivo local está excluido de Git; no subir sus credenciales al repositorio.
5. Abrir el catálogo y comprobar las respuestas de productos y categorías.

Las cadenas PHP entre comillas simples requieren escapar una comilla simple como `\'`
y una barra invertida como `\\`. No quitar espacios que formen parte de la contraseña.
Usar credenciales vigentes; no recuperar contraseñas antiguas del historial Git.

## Configurar mediante el entorno

También se admiten `DOT63_DB_HOST`, `DOT63_DB_NAME`, `DOT63_DB_USER` y
`DOT63_DB_PASSWORD` en el entorno PHP, `$_ENV` o `$_SERVER`.
También se reconocen los prefijos `REDIRECT_` y `REDIRECT_REDIRECT_` usados tras
redirecciones internas. Apache documenta este comportamiento en
[Environment Variables](https://httpd.apache.org/docs/2.4/env.html#redirect).
Esto cubre variables renombradas; no sustituye una configuración que el hosting no transmita a PHP.
`DOT63_DB_PORT` es opcional. Las variables definidas tienen prioridad sobre el archivo
local, incluso si están vacías: eliminar o corregir variables antiguas si interfieren.
Una configuración parcial se rechaza; no se intenta conectar con las credenciales de XAMPP.

`.env.example` es documentación. Copiarlo a `.env` por sí solo no carga variables.
El desarrollo XAMPP conserva sus valores locales únicamente si no hay configuración explícita.

Si la conexión sigue fallando con `SQLSTATE[HY000] [2002] Operation not permitted`,
comprobar el host MySQL y los permisos de conexión desde PHP con el proveedor.
Los detalles se registran en el log del servidor. La API devuelve HTTP 503 con un mensaje
general cuando no hay conexión, sin ejecutar consultas sobre `null` ni mostrar credenciales.
Si la configuración está incompleta, el log enumera los nombres de las variables que
faltan o son inválidas, nunca sus valores.
