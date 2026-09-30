## Purpose

Permitir que una persona cree una cuenta en FlowSync, acceda a la plataforma con email y contraseña, consulte su perfil y cierre sesión. Cubre lo que expone la API (`/api/v1`) y lo que se ve y se puede hacer en pantalla.

## Requirements

### Requirement: API — Registro de cuenta

El sistema SHALL permitir crear una cuenta mediante `POST /api/v1/auth/signup` con `fullName` (texto o `null`), `email`, `password` y `passwordConfirmation`, y SHALL dejar la sesión iniciada devolviendo un token de acceso.

#### Scenario: Registro correcto con nombre
- **WHEN** se envía `POST /api/v1/auth/signup` con `fullName` "Ada Lovelace", un email válido que no está registrado, una `password` de entre 8 y 32 caracteres y una `passwordConfirmation` idéntica
- **THEN** responde 200 con `{ "data": { "user": {...}, "token": "..." } }`, donde `user` contiene `id`, `fullName`, `email`, `createdAt`, `updatedAt` e `initials`, el `token` es un texto no vacío y en ningún punto de la respuesta aparece la contraseña

#### Scenario: Registro sin nombre
- **WHEN** se envía el registro con `fullName` a `null` y el resto de datos válidos
- **THEN** responde 200 y el `user` devuelto tiene `fullName` a `null`

#### Scenario: Nombre enviado vacío
- **WHEN** se envía el registro con `fullName` como cadena vacía y el resto de datos válidos
- **THEN** responde 200 y el `user` devuelto tiene `fullName` a `null`

#### Scenario: El token del registro da acceso inmediato
- **WHEN** tras un registro correcto se llama a `GET /api/v1/account/profile` con ese token en la cabecera `Authorization: Bearer`
- **THEN** responde 200 con los datos de la cuenta recién creada

### Requirement: API — Validación de los datos de registro

El sistema SHALL rechazar con 422 cualquier registro con datos inválidos, sin crear la cuenta, devolviendo `{ "errors": [...] }` con un elemento por cada fallo, cada uno con `message`, `rule` y `field`.

#### Scenario: Email ya registrado
- **WHEN** se envía el registro con un email que ya pertenece a otra cuenta
- **THEN** responde 422 con un error de `field` "email" y `rule` "database.unique", y no se crea ninguna cuenta nueva

#### Scenario: Email con formato inválido o demasiado largo
- **WHEN** se envía el registro con un email que no tiene formato de email, o con un email de más de 254 caracteres
- **THEN** responde 422 con un error de `field` "email" y `rule` "email" en el primer caso, o `rule` "maxLength" en el segundo

#### Scenario: Contraseña fuera de longitud
- **WHEN** se envía el registro con una `password` de menos de 8 o de más de 32 caracteres
- **THEN** responde 422 con un error de `field` "password" y `rule` "minLength" o "maxLength" respectivamente

#### Scenario: Confirmación distinta de la contraseña
- **WHEN** se envía el registro con una `passwordConfirmation` de longitud válida pero distinta de `password`
- **THEN** responde 422 con un error de `field` "passwordConfirmation" y `rule` "sameAs"

#### Scenario: Faltan campos
- **WHEN** se envía el registro sin `email`, sin `password`, sin `passwordConfirmation` o sin la clave `fullName` (aunque sea con valor `null`, la clave debe viajar)
- **THEN** responde 422 con un error de `rule` "required" por cada campo ausente

### Requirement: API — Inicio de sesión

El sistema SHALL permitir iniciar sesión mediante `POST /api/v1/auth/login` con `email` y `password`, y SHALL devolver un token de acceso nuevo en cada inicio de sesión correcto.

#### Scenario: Credenciales correctas
- **WHEN** se envía `POST /api/v1/auth/login` con el email y la contraseña de una cuenta existente
- **THEN** responde 200 con `{ "data": { "user": {...}, "token": "..." } }`, con la misma forma de `user` que en el registro

#### Scenario: Cada inicio de sesión emite un token distinto
- **WHEN** la misma cuenta inicia sesión dos veces
- **THEN** las dos respuestas traen tokens diferentes

### Requirement: API — Rechazo de credenciales incorrectas

El sistema SHALL rechazar con 400 los inicios de sesión cuyas credenciales no correspondan a una cuenta, sin emitir token y sin distinguir si el fallo es del email o de la contraseña.

#### Scenario: Contraseña incorrecta
- **WHEN** se envía el login con el email de una cuenta existente y una contraseña que no es la suya, sea cual sea su longitud
- **THEN** responde 400 con `{ "errors": [...] }` y sin token

#### Scenario: Email inexistente
- **WHEN** se envía el login con un email bien formado que no pertenece a ninguna cuenta
- **THEN** responde 400 con el mismo tipo de respuesta que para una contraseña incorrecta

#### Scenario: Datos mal formados
- **WHEN** se envía el login sin `email`, sin `password`, con un email sin formato de email o con un email de más de 254 caracteres
- **THEN** responde 422 con un error por cada campo inválido, con su `field` y su `rule`

### Requirement: API — Consulta del perfil propio

El sistema SHALL devolver los datos de la cuenta autenticada mediante `GET /api/v1/account/profile` y SHALL rechazar con 401 cualquier petición sin un token válido.

#### Scenario: Token válido
- **WHEN** se llama a `GET /api/v1/account/profile` con `Authorization: Bearer <token>` de una sesión activa
- **THEN** responde 200 con `{ "data": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" } }` de esa cuenta

#### Scenario: Sin token
- **WHEN** se llama a `GET /api/v1/account/profile` sin cabecera `Authorization`
- **THEN** responde 401 con `{ "errors": [...] }` y ningún dato de cuenta

#### Scenario: Token inventado o mal formado
- **WHEN** se llama a `GET /api/v1/account/profile` con un token que el sistema no ha emitido
- **THEN** responde 401 con `{ "errors": [...] }`

### Requirement: API — Cierre de sesión

El sistema SHALL invalidar el token usado al llamar a `POST /api/v1/account/logout`, de modo que deje de dar acceso.

#### Scenario: Cierre de sesión correcto
- **WHEN** se llama a `POST /api/v1/account/logout` con un token válido
- **THEN** responde 200 con `{ "message": "Logged out successfully" }` (sin envoltorio `data`)

#### Scenario: El token queda inservible
- **WHEN** tras cerrar sesión se vuelve a usar ese mismo token en `GET /api/v1/account/profile` o en `POST /api/v1/account/logout`
- **THEN** ambas responden 401

#### Scenario: Cierre de sesión sin token
- **WHEN** se llama a `POST /api/v1/account/logout` sin token válido
- **THEN** responde 401

### Requirement: API — Sesiones simultáneas independientes

El sistema SHALL mantener válidos, de forma independiente, todos los tokens emitidos a una misma cuenta hasta que cada uno se cierre.

#### Scenario: Cerrar una sesión no cierra las demás
- **WHEN** una cuenta tiene dos tokens activos (por ejemplo, del registro y de un login posterior) y se cierra sesión con uno de ellos
- **THEN** el otro token sigue devolviendo 200 en `GET /api/v1/account/profile`

### Requirement: API — Iniciales de la cuenta

El sistema SHALL incluir en cada `user` devuelto el campo `initials` en mayúsculas, calculado a partir del nombre o, si no hay nombre, del email.

#### Scenario: Nombre y apellido
- **WHEN** la cuenta tiene `fullName` "Ada Lovelace"
- **THEN** `initials` vale "AL"

#### Scenario: Nombre con más de dos palabras
- **WHEN** la cuenta tiene `fullName` "Ada King Lovelace"
- **THEN** `initials` vale "AK", tomando solo las dos primeras palabras

#### Scenario: Nombre de una sola palabra
- **WHEN** la cuenta tiene `fullName` "Ada"
- **THEN** `initials` vale "AD", con las dos primeras letras de la palabra

#### Scenario: Cuenta sin nombre
- **WHEN** la cuenta tiene `fullName` a `null` y el email "oriol@gmail.com"
- **THEN** `initials` vale "OG", con la inicial de la parte anterior a la arroba y la inicial del dominio

### Requirement: Pantalla — Acceso a las pantallas según el estado de sesión

El sistema SHALL mostrar el perfil solo a quien tiene sesión y las pantallas de inicio de sesión y de registro solo a quien no la tiene.

#### Scenario: Persona sin sesión entra al perfil
- **WHEN** una persona sin sesión abre la dirección `/profile`
- **THEN** acaba en `/login` viendo el formulario de inicio de sesión

#### Scenario: Persona sin sesión abre la raíz o una dirección desconocida
- **WHEN** una persona sin sesión abre `/` o cualquier dirección que no existe
- **THEN** acaba en `/login`

#### Scenario: Persona con sesión abre login o registro
- **WHEN** una persona con sesión abre `/login` o `/register`
- **THEN** acaba en `/profile`

#### Scenario: Persona con sesión abre la raíz o una dirección desconocida
- **WHEN** una persona con sesión abre `/` o cualquier dirección que no existe
- **THEN** acaba en `/profile`

### Requirement: Pantalla — Restauración de la sesión al abrir la aplicación

El sistema SHALL conservar la sesión entre recargas y aperturas de la aplicación en el mismo navegador, comprobando con el servidor que sigue siendo válida antes de darla por buena.

#### Scenario: Recarga con sesión válida
- **WHEN** una persona con sesión abre o recarga `/profile`
- **THEN** ve un indicador de carga (con el texto accesible "Cargando…") mientras se comprueba la sesión y, al resolverse, ve el perfil sin pasar por el login

#### Scenario: Sesión rechazada por el servidor
- **WHEN** el navegador tiene una sesión guardada que el servidor ya no reconoce y la persona abre la aplicación
- **THEN** acaba en `/login` con un aviso rojo "Tu sesión ha caducado. Vuelve a iniciar sesión." y, si recarga de nuevo, ya no aparece ningún aviso ni se intenta restaurar esa sesión

#### Scenario: Servidor inalcanzable al abrir
- **WHEN** el navegador tiene una sesión guardada y la persona abre la aplicación con el servidor caído
- **THEN** acaba en `/login` con un aviso rojo "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." y, al recargar con el servidor ya disponible, recupera la sesión sin volver a introducir sus datos

### Requirement: Pantalla — Formulario de registro

El sistema SHALL ofrecer en `/register` un formulario con nombre completo (opcional), email, contraseña y repetición de la contraseña, y SHALL iniciar sesión y llevar a la persona a su perfil cuando el registro se completa.

#### Scenario: Contenido de la pantalla
- **WHEN** una persona sin sesión abre `/register`
- **THEN** ve el título "FlowSync", la tarjeta "Crea tu cuenta" con los campos "Nombre completo (opcional)", "Email", "Contraseña" (con la pista "Entre 8 y 32 caracteres.") y "Repite la contraseña", el botón "Crear cuenta" y un enlace "Inicia sesión" que lleva a `/login`

#### Scenario: Registro completado con nombre
- **WHEN** la persona rellena todos los campos con datos válidos y pulsa "Crear cuenta"
- **THEN** llega a `/profile` con la sesión iniciada, viendo el nombre que ha escrito

#### Scenario: Registro completado sin nombre
- **WHEN** la persona deja el nombre vacío o con solo espacios, rellena el resto con datos válidos y pulsa "Crear cuenta"
- **THEN** llega a `/profile` con la sesión iniciada, viendo "Sin nombre" en lugar del nombre

#### Scenario: Envío en curso
- **WHEN** la persona pulsa "Crear cuenta" y el servidor aún no ha respondido
- **THEN** el botón queda deshabilitado con el texto "Creando cuenta…"

### Requirement: Pantalla — Errores del formulario de registro

El sistema SHALL explicar en castellano, junto al campo afectado, por qué se rechaza un registro, y SHALL reservar el aviso rojo superior para los fallos que no pertenecen a ningún campo.

#### Scenario: Contraseñas distintas
- **WHEN** la persona pulsa "Crear cuenta" con "Contraseña" y "Repite la contraseña" distintas
- **THEN** ve bajo "Repite la contraseña" el mensaje "Las contraseñas no coinciden." sin que se envíe nada al servidor

#### Scenario: Email ya registrado
- **WHEN** la persona se registra con un email que ya tiene cuenta
- **THEN** ve bajo "Email" el mensaje "Ese email ya está registrado. Inicia sesión en su lugar." y no aparece aviso rojo superior

#### Scenario: Email vacío o con formato inválido
- **WHEN** la persona pulsa "Crear cuenta" con el email vacío o sin formato de email
- **THEN** ve bajo "Email" el mensaje "Falta rellenar el email." en el primer caso o "Introduce una dirección de email válida." en el segundo

#### Scenario: Contraseña fuera de longitud
- **WHEN** la persona pulsa "Crear cuenta" con una contraseña (repetida igual en ambos campos) de menos de 8 o de más de 32 caracteres
- **THEN** ve bajo "Contraseña" el mensaje "la contraseña debe tener al menos 8 caracteres." o "la contraseña no puede superar los 32 caracteres." respectivamente, sustituyendo a la pista "Entre 8 y 32 caracteres."

#### Scenario: Servidor caído o con error
- **WHEN** la persona pulsa "Crear cuenta" y el servidor no responde, o responde con un error interno
- **THEN** ve un aviso rojo sobre el formulario con "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." en el primer caso o "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento." en el segundo, y el botón vuelve a estar activo

### Requirement: Pantalla — Formulario de inicio de sesión

El sistema SHALL ofrecer en `/login` un formulario de email y contraseña, y SHALL llevar a la persona a su perfil cuando las credenciales son correctas.

#### Scenario: Contenido de la pantalla
- **WHEN** una persona sin sesión abre `/login`
- **THEN** ve el título "FlowSync", la tarjeta "Inicia sesión" con el texto "Entra con tu cuenta para volver a tus tareas.", los campos "Email" y "Contraseña", el botón "Entrar" y un enlace "Crea una" que lleva a `/register`

#### Scenario: Credenciales correctas
- **WHEN** la persona escribe el email y la contraseña de su cuenta y pulsa "Entrar"
- **THEN** llega a `/profile` con la sesión iniciada

#### Scenario: Envío en curso
- **WHEN** la persona pulsa "Entrar" y el servidor aún no ha respondido
- **THEN** el botón queda deshabilitado con el texto "Entrando…"

### Requirement: Pantalla — Errores del formulario de inicio de sesión

El sistema SHALL explicar en castellano por qué se rechaza un intento de inicio de sesión, sin revelar si el fallo está en el email o en la contraseña.

#### Scenario: Credenciales incorrectas
- **WHEN** la persona pulsa "Entrar" con un email sin cuenta o con una contraseña equivocada
- **THEN** ve un aviso rojo sobre el formulario con "El email o la contraseña no son correctos." y los dos campos conservan lo que había escrito

#### Scenario: Campos vacíos o email sin formato
- **WHEN** la persona pulsa "Entrar" con el email vacío, con el email sin formato de email o con la contraseña vacía
- **THEN** ve bajo el campo afectado "Falta rellenar el email.", "Introduce una dirección de email válida." o "Falta rellenar la contraseña." respectivamente

#### Scenario: Servidor caído o con error
- **WHEN** la persona pulsa "Entrar" y el servidor no responde, o responde con un error interno
- **THEN** ve un aviso rojo con "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." en el primer caso o "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento." en el segundo

#### Scenario: Un error nuevo sustituye al aviso de sesión caducada
- **WHEN** la persona llegó a `/login` con el aviso "Tu sesión ha caducado. Vuelve a iniciar sesión." y falla un intento de inicio de sesión
- **THEN** el aviso rojo pasa a mostrar el error del intento en lugar del de sesión caducada

### Requirement: Pantalla — Perfil de la persona

El sistema SHALL mostrar en `/profile` los datos de la cuenta con sesión iniciada: iniciales, nombre, email y fecha de alta.

#### Scenario: Cuenta con nombre
- **WHEN** una persona con sesión y nombre "Ada Lovelace" abre `/profile`
- **THEN** ve un círculo con las iniciales "AL", el nombre "Ada Lovelace", su email y la línea "Miembro desde" con la fecha de creación de la cuenta en formato largo en castellano (por ejemplo, "5 de marzo de 2026")

#### Scenario: Cuenta sin nombre
- **WHEN** una persona con sesión y sin nombre abre `/profile`
- **THEN** ve en el lugar del nombre el texto "Sin nombre", bajo él su email y en el círculo las iniciales calculadas a partir del email

### Requirement: Pantalla — Cierre de sesión

El sistema SHALL permitir cerrar la sesión desde el perfil con el botón "Cerrar sesión" y SHALL dejar a la persona en el formulario de inicio de sesión.

#### Scenario: Cierre de sesión correcto
- **WHEN** la persona pulsa "Cerrar sesión" en `/profile`
- **THEN** el botón queda deshabilitado con el texto "Cerrando sesión…", acaba en `/login` sin ningún aviso rojo, y al abrir `/profile` de nuevo o recargar vuelve a `/login`

#### Scenario: Cierre de sesión con el servidor caído
- **WHEN** la persona pulsa "Cerrar sesión" y el servidor no responde
- **THEN** igualmente acaba en `/login` sin sesión y sin ningún aviso rojo

## TAREA B

1. Cuántos requisitos escribió el agente, y cuántos comprobaste tú abriendo el código.
Agente: 52
Revisados: 23

2. Las incoherencias que aparecieron al escribirla.

Requirement: Pantalla — Cierre de sesión, donde se ve como pone pantalla y tal pantalla no existe.

3. Lo que no supiste decidir si era un bug o el contrato. 

   Scenario: Contraseña incorrecta
    - **WHEN** se envía el login con el email de una cuenta existente y una contraseña que no es la suya, sea cual sea su longitud
    - **THEN** responde 400 con `{ "errors": [...] }` y sin token

    En el requerimiento dice que no hay que mostrar el campo que no es valido, pero en el **THEN** dice devolver el campo errors con el campo que ha fallado.