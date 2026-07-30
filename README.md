# Caja de herramientas – Menú Participa

Versión ampliada con cinco publicaciones independientes, formulario de evaluación conectado a Firebase y panel restringido para el superadministrador.

## Publicaciones

1. Diagnóstico e identificación de problemas.
2. Formulación de propuestas ciudadanas.
3. Control social y veedurías.
4. Diálogo, rendición de cuentas y seguimiento.
5. Herramienta de evaluación ciudadana.

## Archivos nuevos

- `caja-5-evaluacion.html`: formulario público rellenable.
- `administracion.html`: inicio de sesión y consulta administrativa.
- `assets/js/firebase-config.js`: configuración del proyecto Firebase suministrado.
- `assets/js/evaluacion.js`: creación de registros en Firestore.
- `assets/js/admin.js`: validación de superadministrador, consulta, filtros y exportación CSV.
- `firebase/`: bloques exactos que deben agregarse a las reglas actuales.

## Colección de Firestore

La herramienta crea documentos en:

`evaluacionesParticipacion`

La ciudadanía solo puede crear documentos que cumplan todas las validaciones. La lectura, listado, actualización y eliminación quedan reservados para `isSuperAdmin()`.

## Configuración obligatoria en Firebase

### 1. Publicar las reglas

Abra `firebase/INSTRUCCIONES_REGLAS_FIREBASE.md` y agregue los dos bloques indicados a las reglas actuales. No reemplace el resto de reglas.

### 2. Habilitar el inicio de sesión

En Firebase Console:

1. Entre a **Authentication > Sign-in method**.
2. Habilite **Correo electrónico/Contraseña**.
3. Entre a **Authentication > Settings > Authorized domains**.
4. Agregue el dominio de GitHub Pages, por ejemplo `USUARIO.github.io`.

### 3. Verificar el superadministrador

La cuenta administrativa debe existir en Firebase Authentication y ser reconocida por las funciones actuales mediante una de estas opciones:

- Custom claim `role: "super_admin"` o `super_admin: true`.
- Documento `users/{uid}` con `role: "super_admin"` y `active: true`.
- Documento legado `users/{correo}` con un rol de superadministrador y `active: true`.

## Publicación en GitHub Pages

1. Cree o use un repositorio público.
2. Cargue todo el contenido de esta carpeta conservando su estructura.
3. Entre a **Settings > Pages**.
4. En **Build and deployment**, seleccione **Deploy from a branch**.
5. Seleccione la rama `main` y la carpeta `/ (root)`.
6. Guarde.

La portada quedará en:

`https://USUARIO.github.io/REPOSITORIO/`

## Enlaces directos

- `/caja-1-diagnostico.html`
- `/caja-2-propuestas.html`
- `/caja-3-control-social.html`
- `/caja-4-dialogo-rendicion.html`
- `/caja-5-evaluacion.html`
- `/administracion.html`
- `/botones-para-insertar.html`

## Rama preparada

Nombre de la rama de desarrollo:

`feature/herramienta-evaluacion-admin`

El paquete adicional `.bundle` conserva la rama, la base original y los commits de implementación y validación.

## Comprobación básica

1. Abra el formulario desde el dominio autorizado de GitHub Pages.
2. Envíe una evaluación de prueba.
3. Confirme en Firestore que se creó un documento en `evaluacionesParticipacion`.
4. Abra `administracion.html` e inicie sesión con el superadministrador.
5. Verifique tabla, filtros, detalle y exportación CSV.
6. Pruebe con una cuenta que no sea superadministrador: el panel debe negar el acceso.

## Seguridad

La clave API de Firebase identifica el proyecto web, pero no concede acceso por sí sola. La protección efectiva depende de Firebase Authentication y de las reglas de Firestore. No habilite lectura pública para la colección de evaluaciones.
