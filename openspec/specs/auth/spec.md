# auth Specification

## Purpose

Permitir que una persona cree una cuenta, inicie y cierre sesión y consulte su perfil, tanto a través de la API HTTP como desde las pantallas de acceso de la aplicación web. Esta spec describe el comportamiento que el sistema tiene hoy.

## Requirements

### Requirement: Registro de cuenta por API

El sistema SHALL permitir crear una cuenta mediante `POST /api/v1/auth/signup` con los campos `fullName` (texto o `null`), `email`, `password` y `passwordConfirmation`, y SHALL responder con `200` y el cuerpo `{ "data": { "user": ..., "token": ... } }`, de modo que la cuenta nueva queda ya con sesión iniciada.

#### Scenario: Registro con datos válidos

- **WHEN** se envía un registro con nombre, un email que no existe todavía, una contraseña de entre 8 y 32 caracteres y la misma contraseña como confirmación
- **THEN** la respuesta es `200` y contiene los datos públicos del usuario creado y un token de acceso con el que ya se pueden llamar a las rutas protegidas

#### Scenario: Registro sin nombre

- **WHEN** se envía un registro con `fullName` igual a `null` y el resto de campos válidos
- **THEN** la cuenta se crea igualmente y el usuario devuelto tiene `fullName` a `null`

#### Scenario: Registro sin la clave del nombre

- **WHEN** se envía un registro en el que la clave `fullName` no está presente (aunque el resto de campos sean válidos)
- **THEN** la respuesta es `422` con un error de regla `required` sobre el campo `fullName`

### Requirement: Validación de los datos de registro

El sistema SHALL rechazar con `422` los registros que incumplan las reglas de los campos, y SHALL devolver en un único cuerpo `{ "errors": [...] }` todos los errores detectados, cada uno con `message`, `rule` y `field`. El sistema SHALL NOT crear la cuenta si hay algún error.

#### Scenario: Email ya registrado

- **WHEN** se envía un registro con un email que ya pertenece a otra cuenta
- **THEN** la respuesta es `422` con un error de regla `database.unique` sobre el campo `email`

#### Scenario: Email con formato inválido o demasiado largo

- **WHEN** se envía un registro cuyo `email` no es una dirección válida o supera los 254 caracteres
- **THEN** la respuesta es `422` con un error sobre el campo `email` (regla `email` o `maxLength`, respectivamente)

#### Scenario: Contraseña fuera de longitud

- **WHEN** se envía un registro con una contraseña de menos de 8 o de más de 32 caracteres
- **THEN** la respuesta es `422` con un error de regla `minLength` o `maxLength` sobre `password`, con el límite aplicable en `meta`

#### Scenario: Confirmación distinta de la contraseña

- **WHEN** se envía un registro cuyo `passwordConfirmation` no coincide con `password`
- **THEN** la respuesta es `422` con un error de regla `sameAs` sobre el campo `passwordConfirmation`

#### Scenario: Campos ausentes o vacíos

- **WHEN** se envía un registro sin `email`, `password` o `passwordConfirmation`, o con alguno de ellos como cadena vacía
- **THEN** la respuesta es `422` con un error de regla `required` por cada campo afectado

#### Scenario: Varios errores a la vez

- **WHEN** se envía un registro con una contraseña demasiado corta y una confirmación distinta
- **THEN** la respuesta es `422` y su lista de errores incluye tanto el de `password` como el de `passwordConfirmation`

#### Scenario: Tipo de dato incorrecto

- **WHEN** se envía un registro en el que `fullName` es un número en lugar de un texto
- **THEN** la respuesta es `422` con un error de regla `string` sobre el campo `fullName`

### Requirement: Inicio de sesión por API

El sistema SHALL permitir iniciar sesión mediante `POST /api/v1/auth/login` con `email` y `password`, y SHALL responder con `200` y el cuerpo `{ "data": { "user": ..., "token": ... } }`.

#### Scenario: Credenciales correctas

- **WHEN** se envía el email y la contraseña de una cuenta existente
- **THEN** la respuesta es `200` con los datos públicos del usuario y un token de acceso nuevo

#### Scenario: Credenciales incorrectas

- **WHEN** se envía un email que no pertenece a ninguna cuenta, o una contraseña que no corresponde a la cuenta
- **THEN** la respuesta es `400` con `{ "errors": [{ "message": "Invalid user credentials" }] }`, sin campo asociado y sin distinguir cuál de los dos datos era el erróneo

#### Scenario: Campos ausentes o vacíos

- **WHEN** se envía el login sin `email` o sin `password`, o con alguno como cadena vacía
- **THEN** la respuesta es `422` con un error de regla `required` por cada campo afectado

#### Scenario: Email mal formado

- **WHEN** se envía el login con un `email` que no es una dirección válida
- **THEN** la respuesta es `422` con un error de regla `email` sobre el campo `email`, sin llegar a comprobar credenciales

#### Scenario: La longitud de la contraseña no se valida al entrar

- **WHEN** se envía el login con una contraseña de cualquier longitud (por ejemplo, de un solo carácter)
- **THEN** la petición no se rechaza por validación y se evalúa como un intento de credenciales normal

### Requirement: Cada inicio de sesión emite un token independiente

El sistema SHALL emitir un token de acceso distinto en cada registro y en cada inicio de sesión, y SHALL mantener válidos los tokens emitidos anteriormente para la misma cuenta.

#### Scenario: Dos inicios de sesión seguidos

- **WHEN** una misma cuenta inicia sesión dos veces y se usa el primer token para consultar el perfil
- **THEN** la respuesta es `200`, porque el primer token sigue siendo válido

### Requirement: Consulta del perfil propio

El sistema SHALL devolver, mediante `GET /api/v1/account/profile` con la cabecera `Authorization: Bearer <token>`, los datos públicos del usuario dueño del token, con `200` y el cuerpo `{ "data": { ... } }`.

#### Scenario: Token válido

- **WHEN** se consulta el perfil con un token emitido en un registro o inicio de sesión y todavía no revocado
- **THEN** la respuesta es `200` con los datos públicos de ese usuario

#### Scenario: Sin token

- **WHEN** se consulta el perfil sin cabecera `Authorization`
- **THEN** la respuesta es `401` con `{ "errors": [{ "message": "Unauthorized access" }] }`

#### Scenario: Token inválido

- **WHEN** se consulta el perfil con un token que no existe, está mal formado o ha sido revocado
- **THEN** la respuesta es `401` con `{ "errors": [{ "message": "Unauthorized access" }] }`

### Requirement: Datos públicos del usuario

El sistema SHALL exponer de cada usuario únicamente `id`, `fullName`, `email`, `createdAt`, `updatedAt` e `initials`, y SHALL NOT incluir nunca la contraseña ni ningún derivado de ella en ninguna respuesta.

#### Scenario: Contenido de la respuesta

- **WHEN** cualquier respuesta devuelve un usuario (registro, login o perfil)
- **THEN** el objeto contiene exactamente esas seis propiedades y ninguna relacionada con la contraseña

#### Scenario: Iniciales con nombre de dos palabras

- **WHEN** el usuario se llama "Ada Lovelace"
- **THEN** sus `initials` son `AL`

#### Scenario: Iniciales con nombre de una palabra

- **WHEN** el usuario se llama "Ada"
- **THEN** sus `initials` son `AD`, las dos primeras letras del nombre en mayúsculas

#### Scenario: Iniciales con nombre de más de dos palabras

- **WHEN** el usuario se llama "Ada King Lovelace"
- **THEN** sus `initials` son `AK`, formadas con las dos primeras palabras y no con la última

#### Scenario: Iniciales sin nombre

- **WHEN** el usuario no tiene nombre y su email es `grace@example.com`
- **THEN** sus `initials` son `GE`, la inicial de la parte del email anterior a la arroba y la inicial del dominio

### Requirement: Cierre de sesión por API

El sistema SHALL permitir cerrar sesión mediante `POST /api/v1/account/logout` con un token válido, revocando únicamente ese token, y SHALL responder con `200` y el cuerpo `{ "message": "Logged out successfully" }`, sin el envoltorio `data`.

#### Scenario: Cierre de sesión con token válido

- **WHEN** se llama al logout con un token válido
- **THEN** la respuesta es `200` con el mensaje de cierre correcto y ese token deja de ser aceptado (consultar el perfil con él devuelve `401`)

#### Scenario: Otros tokens de la misma cuenta no se ven afectados

- **WHEN** una cuenta con dos tokens válidos cierra sesión con uno de ellos
- **THEN** el otro token sigue siendo aceptado en las rutas protegidas

#### Scenario: Cierre de sesión sin token válido

- **WHEN** se llama al logout sin token, o con un token inexistente o ya revocado
- **THEN** la respuesta es `401` con `{ "errors": [{ "message": "Unauthorized access" }] }`

### Requirement: Formato JSON de las respuestas

El sistema SHALL responder siempre en JSON a las rutas de autenticación, aunque la petición no indique que acepta JSON; las respuestas correctas SHALL llevar sus datos bajo la clave `data` (salvo la del logout) y los errores SHALL llevarse bajo la clave `errors`.

#### Scenario: Petición sin cabecera Accept

- **WHEN** se llama a una ruta protegida sin token y sin cabecera `Accept: application/json`
- **THEN** la respuesta es `401` con cuerpo JSON `{ "errors": [...] }` y no una página HTML ni un redireccionamiento

### Requirement: Pantalla de registro

La aplicación SHALL ofrecer en `/register` un formulario titulado «Crea tu cuenta» con los campos «Nombre completo» (marcado como opcional), «Email», «Contraseña» (con la indicación «Entre 8 y 32 caracteres.») y «Repite la contraseña», un botón «Crear cuenta» y un enlace «Inicia sesión» que lleva a la pantalla de acceso.

#### Scenario: Aspecto inicial

- **WHEN** una persona sin sesión abre `/register`
- **THEN** ve el formulario con sus cuatro campos vacíos, la indicación de longitud bajo la contraseña y el enlace para iniciar sesión

#### Scenario: Registro correcto

- **WHEN** la persona completa email y contraseñas coincidentes válidas y pulsa «Crear cuenta»
- **THEN** su cuenta queda creada con la sesión iniciada y se muestra su pantalla de perfil

#### Scenario: Registro sin rellenar el nombre

- **WHEN** la persona deja vacío (o solo con espacios) el nombre y envía un registro válido
- **THEN** la cuenta se crea sin nombre y el perfil muestra «Sin nombre»

### Requirement: Errores de registro visibles en pantalla

La pantalla de registro SHALL mostrar los errores en castellano junto al campo al que se refieren, y SHALL comprobar en el propio formulario que ambas contraseñas coinciden antes de intentar crear la cuenta.

#### Scenario: Contraseñas distintas

- **WHEN** la persona escribe contraseñas distintas en «Contraseña» y «Repite la contraseña» y pulsa «Crear cuenta»
- **THEN** aparece «Las contraseñas no coinciden.» bajo «Repite la contraseña» y no se crea ninguna cuenta

#### Scenario: Email ya registrado

- **WHEN** la persona envía un email que ya tiene cuenta
- **THEN** aparece «Ese email ya está registrado. Inicia sesión en su lugar.» bajo «Email»

#### Scenario: Email inválido

- **WHEN** la persona envía un email con formato incorrecto
- **THEN** aparece «Introduce una dirección de email válida.» bajo «Email»

#### Scenario: Contraseña demasiado corta o demasiado larga

- **WHEN** la persona envía una contraseña de menos de 8 o de más de 32 caracteres
- **THEN** aparece bajo «Contraseña» un mensaje del tipo «la contraseña debe tener al menos 8 caracteres» o «la contraseña no puede superar los 32 caracteres», en sustitución de la indicación de longitud

#### Scenario: Campos obligatorios vacíos

- **WHEN** la persona pulsa «Crear cuenta» con el email vacío
- **THEN** aparece «Falta rellenar el email.» bajo «Email», sin que el navegador bloquee el envío con sus propios avisos

### Requirement: Pantalla de inicio de sesión

La aplicación SHALL ofrecer en `/login` un formulario titulado «Inicia sesión» con los campos «Email» y «Contraseña», un botón «Entrar» y un enlace «Crea una» que lleva a la pantalla de registro.

#### Scenario: Aspecto inicial

- **WHEN** una persona sin sesión abre `/login`
- **THEN** ve el formulario con los dos campos vacíos y el enlace «¿Aún no tienes cuenta? Crea una»

#### Scenario: Acceso correcto

- **WHEN** la persona introduce las credenciales de una cuenta existente y pulsa «Entrar»
- **THEN** se inicia su sesión y se muestra su pantalla de perfil

### Requirement: Errores de inicio de sesión visibles en pantalla

La pantalla de inicio de sesión SHALL explicar en castellano por qué falla un intento, con un aviso general sobre el formulario cuando el problema no pertenece a un campo concreto y con un mensaje bajo el campo cuando sí.

#### Scenario: Credenciales incorrectas

- **WHEN** la persona envía un email que no existe o una contraseña equivocada
- **THEN** aparece el aviso «El email o la contraseña no son correctos.» y la persona permanece en la pantalla de acceso

#### Scenario: Campos vacíos o email mal formado

- **WHEN** la persona pulsa «Entrar» con un campo vacío o con un email de formato incorrecto
- **THEN** aparece bajo el campo afectado un mensaje como «Falta rellenar el email.» o «Introduce una dirección de email válida.»

#### Scenario: Servidor inalcanzable

- **WHEN** la persona pulsa «Entrar» y la aplicación no consigue conectar con el servidor
- **THEN** aparece el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»

#### Scenario: Fallo interno del servidor

- **WHEN** la persona pulsa «Entrar» y el servidor responde con un error interno
- **THEN** aparece el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

### Requirement: Feedback mientras se envía un formulario de acceso

Las pantallas de registro y de inicio de sesión SHALL deshabilitar su botón principal mientras la petición está en curso y SHALL cambiar su texto para indicarlo.

#### Scenario: Envío en curso del login

- **WHEN** la persona pulsa «Entrar» y la respuesta aún no ha llegado
- **THEN** el botón muestra «Entrando…» y no admite nuevos clics hasta que llega la respuesta

#### Scenario: Envío en curso del registro

- **WHEN** la persona pulsa «Crear cuenta» y la respuesta aún no ha llegado
- **THEN** el botón muestra «Creando cuenta…» y no admite nuevos clics hasta que llega la respuesta

#### Scenario: Se limpian los errores previos al reintentar

- **WHEN** la persona vuelve a enviar un formulario que había mostrado errores
- **THEN** los errores de campo y el aviso del intento anterior desaparecen mientras se procesa el nuevo intento

### Requirement: Pantalla de perfil

La aplicación SHALL mostrar en `/profile` al usuario con sesión iniciada su círculo de iniciales, su nombre (o «Sin nombre» si no tiene), su email, la fecha de alta como «Miembro desde» con formato largo en castellano y un botón «Cerrar sesión».

#### Scenario: Perfil de un usuario con nombre

- **WHEN** una persona con sesión y nombre «Ada Lovelace» abre `/profile`
- **THEN** ve las iniciales «AL», el nombre «Ada Lovelace», su email y «Miembro desde» seguido de la fecha de creación de su cuenta escrita como, por ejemplo, «29 de septiembre de 2026»

#### Scenario: Perfil de un usuario sin nombre

- **WHEN** una persona con sesión y sin nombre abre `/profile`
- **THEN** ve «Sin nombre» como título y las iniciales derivadas de su email (por ejemplo, `GE` para `grace@example.com`)

### Requirement: Cierre de sesión desde la pantalla

La aplicación SHALL cerrar la sesión de la persona al pulsar «Cerrar sesión» y llevarla a la pantalla de acceso, aunque el servidor no responda.

#### Scenario: Cierre de sesión normal

- **WHEN** la persona pulsa «Cerrar sesión» en su perfil
- **THEN** el botón muestra «Cerrando sesión…» y a continuación se muestra la pantalla de inicio de sesión, y una recarga de página no recupera la sesión

#### Scenario: Servidor caído al cerrar sesión

- **WHEN** la persona pulsa «Cerrar sesión» y el servidor no responde o rechaza la petición
- **THEN** igualmente se muestra la pantalla de inicio de sesión sin ningún mensaje de error y la persona deja de estar identificada en la aplicación

### Requirement: Acceso a pantallas según el estado de sesión

La aplicación SHALL permitir ver el perfil solo con sesión iniciada y las pantallas de registro e inicio de sesión solo sin ella, redirigiendo en caso contrario, y SHALL mostrar un indicador de carga mientras comprueba una sesión guardada, sin redirigir antes de terminar la comprobación.

#### Scenario: Perfil sin sesión

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** es redirigida a `/login`

#### Scenario: Acceso o registro con sesión activa

- **WHEN** una persona con sesión abre `/login` o `/register`
- **THEN** es redirigida a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** una persona abre una dirección que no existe en la aplicación
- **THEN** es llevada a `/profile`, y de ahí a `/login` si no tiene sesión

#### Scenario: Comprobación de una sesión guardada

- **WHEN** una persona con una sesión guardada de visitas anteriores abre cualquier pantalla de la aplicación
- **THEN** ve un indicador de carga mientras se valida su sesión y, una vez validada, llega a la pantalla solicitada sin pasar por `/login`

### Requirement: Persistencia de la sesión entre visitas

La aplicación SHALL conservar la sesión al recargar la página o al volver a abrir la aplicación en el mismo navegador, mientras el servidor siga aceptando el token guardado, y SHALL avisar en la pantalla de acceso cuando no haya podido restaurarla.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página
- **THEN** sigue en su perfil sin tener que volver a identificarse

#### Scenario: Sesión rechazada por el servidor

- **WHEN** el servidor ya no reconoce el token guardado (por ejemplo, porque fue revocado) y la persona abre la aplicación
- **THEN** llega a `/login` con el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.» y la sesión guardada se descarta

#### Scenario: Servidor caído al restaurar la sesión

- **WHEN** la persona abre la aplicación con una sesión guardada y el servidor no es alcanzable
- **THEN** llega a `/login` con un aviso que explica el fallo de conexión, y al recargar la página cuando el servidor vuelva a estar disponible recupera su sesión sin volver a identificarse

#### Scenario: El aviso desaparece al entrar de nuevo

- **WHEN** la persona ve el aviso de sesión perdida en `/login` e inicia sesión con éxito
- **THEN** llega a su perfil y, al cerrar sesión después, el aviso anterior no vuelve a aparecer
