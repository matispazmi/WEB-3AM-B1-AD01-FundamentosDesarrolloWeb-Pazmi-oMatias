# AutoPan — Gestión de mantenimiento vehicular

Aplicación académica de frontend. No requiere servidor, base de datos, instalación de paquetes ni conexión a Internet: Bootstrap y SweetAlert2 se incluyen como archivos locales. Los datos de demostración y las solicitudes se almacenan en el `localStorage` del navegador actual.

## Cómo ejecutar

1. Clona o descarga este repositorio y abre la carpeta en Visual Studio Code.
2. Abre `index.html` directamente en un navegador.
3. Para probar los roles, inicia sesión con una cuenta de muestra:

   | Rol | Correo | Contraseña |
   | --- | --- | --- |
   | Administrador | `admin@autoPan.com` | `admin123` |
   | Usuario | `usuario@autoPan.com` | `usuario123` |
   | Usuario de prueba | `cliente.demo@autoPan.com` | `cliente123` |

No hay que instalar paquetes. Para reiniciar los datos de muestra, borra las claves `autoPan_usuarios`, `autoPan_mantenimientos`, `autoPan_sesion` y `autoPan_historial` desde el almacenamiento local del navegador.

## Funciones

- **Inicio (`index.html`)**: presenta los servicios, beneficios y datos ficticios del taller.
- **Acceso y registro (`login.html`)**: inicia sesión o registra cuentas que reciben siempre el rol `usuario`. Los administradores no se registran desde el formulario público.
- **Perfil (`perfil.html`)**: muestra nombre, correo y contacto; permite actualizar los datos personales y opcionalmente cambiar la contraseña. El correo se muestra como solo lectura y no se presenta el rol en este perfil.
- **Solicitudes (`mantenimiento.html`)**: obtiene automáticamente propietario y contacto de la cuenta, y solicita solo los datos del vehículo y del servicio. Incluye fecha, hora, jornada, confirmación y descripción.
- **Mis solicitudes (`mis-solicitudes.html`)**: muestra solo las solicitudes de la cuenta activa. El cliente puede cancelar solicitudes pendientes y consultar el historial con su estado.
- **Administración (`admin.html`)**: separa en pestañas la gestión de solicitudes y el directorio de usuarios. Permite buscar, filtrar, consultar, crear solicitudes para clientes, editar solo los datos del mantenimiento, desactivar, reactivar y eliminar. En la pestaña de usuarios se editan los datos personales y se habilitan, deshabilitan o eliminan cuentas.

## Archivos

```text
index.html, login.html, perfil.html, mantenimiento.html, mis-solicitudes.html, admin.html
css/estilos.css
js/datos.js, js/autenticacion.js, js/perfil.js, js/mantenimiento.js, js/admin.js
img/taller-autoPan.svg
vendor/bootstrap/ y vendor/sweetalert2/
```

Los usuarios, mantenimientos e historial son arrays de objetos definidos y gestionados en `js/datos.js`. Durante el uso, las operaciones agregan, editan y eliminan elementos directamente de esos arrays en memoria; después guardan una copia con `JSON.stringify()` en `localStorage`, que se recupera al abrir la aplicación de nuevo con `JSON.parse()`. El almacenamiento es propio de cada navegador y equipo; no se sube a GitHub ni se comparte entre usuarios.

Los ejemplos de inicio incluyen tres cuentas y los datos nuevos se agregan al almacenamiento existente sin borrar solicitudes anteriores. Bootstrap se usa en los formularios y en el perfil; SweetAlert2 muestra avisos y confirmaciones de eliminación. Las dos bibliotecas están copiadas dentro de `vendor/` con sus licencias.

> **Aviso académico:** la autenticación y los roles son una simulación. Las contraseñas están en el código y el almacenamiento del navegador se puede modificar. No uses información real ni este proyecto como sistema seguro.
