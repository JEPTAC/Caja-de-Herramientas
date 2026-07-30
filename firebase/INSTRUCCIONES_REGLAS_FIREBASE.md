# Adición mínima a las reglas de Firestore

Esta versión **no requiere reemplazar ni reescribir las reglas actuales**.
Solo deben agregarse dos bloques:

1. Pegue el contenido de `1-funcion-agregar.rules` junto a las demás funciones de validación, antes de `CONTENIDO DEL PORTAL`.
2. Pegue el contenido de `2-match-agregar.rules` antes de la regla global final `match /{document=**}`.
3. Publique las reglas y revise que Firebase no muestre errores de sintaxis.

## Resultado de permisos

| Operación | Visitante | Usuario común/admin/editor | Superadministrador |
|---|---:|---:|---:|
| Crear evaluación válida | Sí | Sí | Sí |
| Leer o listar evaluaciones | No | No | Sí |
| Modificar evaluación | No | No | Sí |
| Eliminar evaluación | No | No | Sí |

La colección creada por la página es:

`evaluacionesParticipacion`

El panel `administracion.html` consulta esa colección después de iniciar sesión con Firebase Authentication. La cuenta debe ser reconocida por las funciones existentes `isSuperAdmin()` mediante custom claims o mediante su documento en `users/{uid}` o `users/{correo}`.

## Authentication

En Firebase Console:

1. Abra **Authentication > Sign-in method**.
2. Habilite **Correo electrónico/Contraseña**.
3. Abra **Authentication > Settings > Authorized domains**.
4. Agregue el dominio del sitio publicado, por ejemplo `usuario.github.io`.

No cree una regla pública de lectura. El formulario funciona con creación pública y el panel depende de autenticación más rol.
