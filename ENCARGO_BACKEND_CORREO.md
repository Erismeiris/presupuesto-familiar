# Encargo al backend: buzón compartido, atribución por usuario y reglas remitente + asunto

**Decisión de partida.** El buzón IMAP es **siempre el mismo**, el de la propia
aplicación (`presupuesto.familiar@…`), y son los usuarios quienes configuran el
reenvío de los avisos de su banco a esa cuenta. Las credenciales IMAP **se quedan
en el `.env`**: no hace falta tabla de cuentas de correo, ni cifrado de
contraseñas, ni OAuth. Lo único que la app necesita saber de cada usuario es
**qué remitente y qué asunto** le pertenecen.

Queda descartado el encargo anterior de `CuentaCorreo` y todo lo que colgaba de
él (cifrado AES, clave maestra, endpoint de prueba de conexión por usuario y
refactor de `getImapClient(cuenta)`).

## Lo que ya está bien y no hay que rehacer

Revisado el estado actual de `utils/cronJobs.js` y `utils/imapService.js`:

- Control de duplicados en **gastos y en ingresos**, con la nota de que la
  búsqueda IMAP puede devolver el mismo correo más de una vez.
- El **tipo configurado del asunto manda sobre la IA** (`tipoDelAsunto`), con
  match por subcadena, que además tolera el prefijo `Fwd:` de los reenvíos.
- **Fecha de respaldo** desde la cabecera `Date` cuando el cuerpo no la trae.
- **Cada correo aislado** en su `try/catch`: uno que falle no aborta el lote.
- **`dryRun` por el mismo camino** que el sync real, así que la previsualización
  refleja lo que va a pasar de verdad.
- Filtro **`seen: false`** para no reprocesar correos antiguos (ver punto 2: sobre
  un buzón compartido este filtro necesita matiz).

## Los seis cambios

### 1. Atribuir cada mensaje a su usuario

`syncPaymentEmails(userId, …)` recibe hoy el `userId` de quien llama e inserta
**todo lo que encuentra** a nombre de ese usuario. Con un buzón compartido, si el
usuario A importa, se lleva los correos reenviados por B que encajen con sus
reglas; y si A no tiene reglas, cae al asunto por defecto y encaja con casi todo.

Hay que resolver el `userId` **por mensaje**, no recibirlo por parámetro.
Propuesta: **alias por usuario**. Cada uno reenvía a
`presupuesto.familiar+<sufijo>@…`, el sufijo se guarda en su perfil, y la
atribución se hace por `Delivered-To` / `To`, **no por `From`** —con reenvío
automático el `From` sigue siendo el del banco, así que no identifica a nadie—.
Un mensaje que no se pueda atribuir **no se procesa ni se marca como leído**: se
deja en una lista de «sin atribuir» consultable, para no perder nada en silencio.

### 2. Marca de procesado por usuario, no el flag del buzón

El flag de leído es del buzón, no del usuario. En cuanto el sync de A marca un
mensaje, el filtro `seen: false` impide que B lo vea nunca: **el segundo usuario
pierde movimientos en silencio**. Con un solo usuario funciona; con dos, no.

Hace falta una marca de procesado **por usuario** (tabla `uid + userId + fecha`)
o, si la atribución del punto 1 garantiza un dueño único por mensaje, marcar solo
después de atribuir. Lo segundo es más simple, pero deja de valer si algún día un
mismo correo puede interesar a dos usuarios.

### 3. Devolver `to` y `Delivered-To` en la búsqueda

`fetchPaymentEmails` (`utils/imapService.js`) devuelve hoy solo
`{ uid, from, subject, date, text, html }`, así que **la atribución del punto 1 es
imposible con la forma actual**. Hay que añadir `parsed.to` y la cabecera
`delivered-to`. El dato está disponible: `listEmails` ya devuelve el `to` del
envelope.

### 4. Reglas como pares remitente + asunto

`fetchPaymentEmailsMulti` combina **cada asunto con cada remitente** —el propio
comentario lo explica: IMAP no admite un OR de remitentes en una sola búsqueda—,
o sea un producto cartesiano. Así no se puede distinguir «nuevo movimiento» de un
banco del de otro.

Introducir `ReglaCorreo` con `{ userId, remitente, asunto, tipo, activo }` como
**unidad**, y buscar **por par**, no cruzando las dos listas. `AsuntosCorreo` y
`RemitentesCorreo` quedarían para lo genérico.

### 5. Quitar las reglas compartidas (`userId: null`)

`activosDe()` incluye hoy las filas con `userId: null` tratándolas como
compartidas. Sobre un buzón común, eso aplica la regla de un usuario a todos los
demás. Con reglas por usuario hay que dejar de incluirlas.

### 6. El cron, una sola pasada con atribución

`initCronJobs` depende de `IMAP_SYNC_USER_ID`, es decir, un único usuario. Debe
ser una sola pasada por el buzón, atribuyendo cada mensaje y aplicando las reglas
de su usuario, con el fallo de un usuario aislado para que no tumbe al resto.

## Orden recomendado

Los puntos **1, 2 y 3** son el mismo problema y van juntos: hasta que estén, la
aplicación solo es correcta con un único usuario. El **4** y el **5** son
precisión de las reglas. El **6** es consecuencia de los anteriores.

## Dos notas

**Cuerpo de los correos reenviados.** `extraerDatosPago` funciona hoy con avisos
directos del banco. Un reenvío automático llega envuelto y a veces citado con
`>`, así que la extracción puede degradarse. Conviene probarlo con un correo real
reenviado en cuanto haya credenciales.

**Tipo aplanado a `'auto'`.** Si `process-payments` recibe asuntos explícitos,
`resolverAsuntosConfig` los devuelve todos con `tipo: 'auto'`, y entonces
`tipoDelAsunto` no puede forzar nada y decide la IA. El frontend ya no manda
asuntos, así que hoy no se dispara, pero es una trampa latente: que acepte ids o
conserve el tipo configurado de los que reconozca.

## Nota de riesgo

Un buzón único que concentra los avisos bancarios de todos los usuarios es un
objetivo de alto valor y un punto único de fallo: quien entre ahí ve los
movimientos de todo el mundo. Conviene verificación en dos pasos en esa cuenta,
contraseña de aplicación exclusiva para esta app, y decidir si los correos ya
procesados se borran pasado un tiempo en vez de acumularse indefinidamente.

Además, cualquier endpoint que recorra el buzón para descubrir remitentes y
asuntos debe devolver **solo los mensajes atribuidos al usuario del token**: sin
ese filtro, cada usuario vería de qué bancos recibe avisos el resto.

## Pendiente de decidir

El esquema del alias: `+sufijo` sobre la cuenta actual (lo más simple, no toca
infraestructura) frente a buzones separados por usuario. Y si se acepta el
reenvío manual como vía alternativa, donde el `From` sí es la dirección del
usuario y sirve como atribución secundaria.

## Lo que hará el frontend cuando esto esté

En el engranaje junto a «Importar desde correo»: la dirección de reenvío del
usuario con su alias, lista para copiar y con instrucciones breves; y la lista de
combinaciones remitente + asunto detectadas en **sus** correos, con contadores y
última fecha, casillas para seleccionar y alta múltiple con el tipo de cada una
(Automático / Siempre gasto / Siempre ingreso).
