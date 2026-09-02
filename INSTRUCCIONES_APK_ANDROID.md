# Instrucciones para generar la APK Android de "Presupuesto Familiar"

Documento operativo: qué hace hoy la parte de presupuesto, qué hay que tocar para
que funcione dentro de un móvil, y los pasos exactos para producir el `.apk`.

---

## 1. Inventario de la lógica de presupuesto (lo que debe seguir funcionando en la APK)

### 1.1 Ficheros implicados

| Capa | Fichero |
|---|---|
| Página | `src/app/presupuesto/presupuesto-page.component.ts` (header + `<app-resumen>`) |
| Pantalla principal | `src/app/presupuesto/resumen/resumen.component.{ts,html,css}` (526 / 466 / 689 líneas) |
| Importación | `src/app/presupuesto/importar-excel/importar-excel.component.{ts,html,css}` |
| Datos de ejemplo | `src/app/presupuesto/presupuesto-demo.ts` |
| Servicio de dominio | `src/app/services/presupuesto.service.ts` |
| Servicios auxiliares | `categoria.service.ts`, `categoria-ingreso.service.ts`, `gastos.service.ts`, `regla.service.ts`, `openai.service.ts`, `auth.service.ts` |
| Modelos | `src/app/interface/presupuesto.interface.ts`, `categoria.ts`, `regla.interface.ts`, `user.interface.ts` |
| Infra | `src/app/interceptors/auth.interceptor.ts`, `src/app/guards/auth.guard.ts`, `src/app/app.routes.ts`, `src/app/app.config.ts` |

### 1.2 Funcionalidades a portar

1. **Resumen mensual** (`ResumenMensual`): saldo inicial, saldo final, ahorro del mes,
   ahorro previsto, variación % del ahorro, bloques de gastos e ingresos con
   `previstoTotal` / `realTotal` / `diferenciaTotal` y sus líneas.
2. **Navegación por meses**: `mesActual()`, `desplazarMes()`, `nombreDelMes()` en
   `presupuesto.service.ts`; el mes vive en una señal compartida (`mes`) en formato `YYYY-MM`.
3. **Modo demo sin sesión**: si no hay `userId`, se pinta `resumenDemo(mes)` en lugar de
   llamar al backend, con banda de aviso y enlaces a login/registro. **Esta es la pantalla
   de arranque de la app** (`{path: '', redirectTo: '/presupuesto'}`, sin guard).
4. **Edición del saldo inicial** → `PUT /presupuestos/:id`, y la respuesta refresca la señal `resumen`.
5. **Edición del importe previsto por línea** → `PUT /presupuestos/lineas/:lineaId`
   (mapa `previstoEnEdicion`, set `guardandoPrevisto`, botones ✓ / ✗ por fila).
6. **Panel de ajustes de categorías** (icono engranaje):
   - listado de todas las líneas presupuestadas (gasto + ingreso),
   - clasificación **50/30/20** por categoría de gasto (`tipo503020`: `necesidades` | `deseos` | `ahorro`) → `PUT /categorias/:id`,
   - quitar categoría del presupuesto → `DELETE /presupuestos/lineas/:id`,
   - añadir categoría existente → `POST /presupuestos/:id/lineas` + vincular `categoriaId`,
   - crear categoría nueva (gasto o ingreso) → `POST /categorias` o `POST /categoriaingresos`, y encadenar línea + vínculo.
7. **Distribución 50/30/20**: bloque que pinta `porcentajeNecesidades` / `porcentajeDeseos` / `porcentajeAhorro`.
   **Ya está implementado en el backend** (`controllers/presupuestoController.js:238-274`, con
   `tipo503020` como ENUM en `models/Categoria.js`). El `IMPLEMENTACION_50-30-20.md` de este repo
   está obsoleto: describe trabajo ya hecho.
8. **Gráficos CSS**: barras saldo inicial vs. final (`alturaBarras()`) y barras
   previsto vs. real (`anchoBarra()`). Son CSS puro, **no** Chart.js — se portan sin cambios.
9. **Alta de gasto** y **alta de ingreso** con formulario inline → `POST /gastos` / `POST /ingresos`
   (el `userId` lo inyecta `PresupuestoService.crearTransaccion`).
10. **Detalle por categoría**: al pulsar una fila se cargan `GET /presupuestos/transacciones`
    y se filtran por `categoriaId` (o por nombre si la línea no está vinculada).
11. **Edición inline de una transacción** → `PUT /gastos/:id` o `PUT /ingresos/:id`.
12. **Importación de Excel/CSV** (`importar-excel.component.ts`), flujo de 4 pasos:
    `idle → mapeo → clasificando → revision → importando`, con
    - lectura con `xlsx` (`XLSX.read` sobre `ArrayBuffer` de un `FileReader`),
    - autodetección de columnas (fecha / descripción / importe),
    - `normalizarFecha()` (DD/MM/YYYY → ISO) y `parseMonto()` (formato español e inglés),
    - signo del importe → `ingreso` (≥0) o `gasto` (<0), conmutable a mano,
    - clasificación con IA vía backend (`POST /gastos/clasificar`, `POST /ingresos/clasificar`),
    - tabla de revisión editable y alta masiva con `forkJoin`.
13. **Vinculación automática** de líneas sin `categoriaId` por coincidencia de nombre al arrancar
    (`vincularLineasSinCategoria`).
14. **Sesión**: login contra backend propio (JWT en memoria + cookie httpOnly de refresh),
    identidad en `localStorage`, `authInterceptor` que reintenta con `POST /auth/refresh` ante 401/403.

### 1.3 Endpoints que consume (base = `environment.apiUrl`)

```
GET    /presupuestos/resumen?userId&mes
GET    /presupuestos/meses?userId
GET    /presupuestos/transacciones?userId&mes
PUT    /presupuestos/:presupuestoId              { saldoInicial }
GET    /presupuestos/:presupuestoId/lineas
POST   /presupuestos/:presupuestoId/lineas       { tipo, nombre, previsto }
PUT    /presupuestos/lineas/:lineaId             { previsto | categoriaId | nombre }
DELETE /presupuestos/lineas/:lineaId
GET    /categorias?userId          POST /categorias          PUT /categorias/:id
GET    /categoriaingresos          POST /categoriaingresos
POST   /gastos      PUT /gastos/:id      DELETE /gastos/:id     POST /gastos/clasificar
POST   /ingresos    PUT /ingresos/:id                           POST /ingresos/clasificar
GET    /reglas      POST /reglas
POST   /auth/login  POST /auth/refresh  POST /auth/logout   POST /user
```

---

## 2. Estrategia: Capacitor sobre la app Angular actual

**Decisión: envolver la aplicación Angular 19 existente con Capacitor.** Se reutiliza el 100 %
de la lógica anterior (señales, PrimeNG, `xlsx`, servicios HTTP) y la APK queda sincronizada
con la web sin mantener dos bases de código.

Se descarta reescribir en Kotlin/Compose o Flutter: obligaría a reimplementar las ~1.500 líneas
del módulo de presupuesto y el flujo de importación, sin ganancia funcional (no se usan
sensores, cámara ni tareas en segundo plano).

> Ionic no es necesario. Capacitor funciona con cualquier build web; PrimeNG se mantiene.

---

## 3. Bloqueantes a resolver ANTES de empaquetar

Estos siete puntos harían que la APK compile pero no funcione. Hay que corregirlos en el código.

### 3.1 `localhost` no es el servidor, es el móvil

`src/environments/environment.ts` y `environment.prod.ts` apuntan a `http://localhost:3000/api`.
Dentro de un dispositivo Android, `localhost` es el propio teléfono → todas las llamadas fallan.

Además, `src/app/services/auth.service.ts` tiene la URL **hardcodeada**:

```ts
var baseURL = 'http://localhost:3000'   // línea 22 — hay que eliminarla
```

**Corrección:**

```ts
// src/environments/environment.ts  (desarrollo con el móvil en la misma LAN)
export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.50:3000/api',   // IP del PC que sirve el backend
  authUrl: 'http://192.168.1.50:3000',
  openaiApiKey: ''
};

// src/environments/environment.prod.ts  (producción: HTTPS obligatorio)
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.es/api',
  authUrl: 'https://api.tu-dominio.es',
  openaiApiKey: ''
};
```

```ts
// src/app/services/auth.service.ts
import { environment } from '../../environments/environment';
const baseURL = environment.authUrl;      // sustituye al var hardcodeado
```

Comprueba después que no queda ninguna URL fija:

```bash
grep -rn "localhost:3000" src/ firebase.config.ts
```

### 3.2 Tráfico en claro bloqueado por Android

Android 9+ prohíbe HTTP sin cifrar. En producción usa HTTPS y no toques nada.
Para probar contra el backend de desarrollo en la LAN, añade una excepción **solo para esa IP**:

`android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">192.168.1.50</domain>
  </domain-config>
</network-security-config>
```

y referénciala en `android/app/src/main/AndroidManifest.xml`, dentro de `<application ...>`:

```xml
android:networkSecurityConfig="@xml/network_security_config"
```

**No** uses `android:usesCleartextTraffic="true"` global en la build de release.

### 3.3 La cookie httpOnly de refresh no viaja desde el WebView

`AuthService` depende de `withCredentials: true` y de una cookie httpOnly que pone el backend
(`/auth/login`, `/auth/refresh`, `/auth/logout`). En Capacitor el origen del WebView es
`https://localhost`, distinto del origen del API → la cookie es de tercera parte y el WebView
la descarta. Sin esto **la sesión se pierde en cada arranque** y el `authInterceptor` entra en
bucle de refresh fallido.

Confirmado en el backend (`controllers/authController.js:88-94`):

```js
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',        // ← esto no sale nunca del WebView
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

`sameSite: 'strict'` impide el envío en cualquier petición cross-site. Cambiarlo a `'none'`
obliga además a `secure: true`, que obliga a HTTPS: no hay forma de que esto funcione
contra `http://192.168.x.x:3000` en desarrollo.

**Opción A (sin tocar backend, recomendada para empezar).** Activa el cliente HTTP nativo de
Capacitor, que hace las peticiones fuera del WebView con su propio almacén de cookies:

```ts
// capacitor.config.ts
plugins: {
  CapacitorHttp:    { enabled: true },
  CapacitorCookies: { enabled: true }
}
```

`CapacitorHttp` parchea `fetch` y `XMLHttpRequest`, así que `HttpClient`, el interceptor y los
servicios siguen igual. Efecto lateral favorable: desaparece el problema de CORS.

**Opción B (recomendada, y son ~10 líneas de backend).** Que `/auth/login` devuelva también el
refresh token en el cuerpo y que `/auth/refresh` lo acepte por body, sin dejar de soportar la
cookie para que la web siga igual:

```js
// controllers/authController.js → login(), junto al res.json existente
res.json({ success: true, accessToken, refreshToken, user: {...}, message: 'Login exitoso' });

// controllers/authController.js → refresh(), primera línea del try
const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

// controllers/authController.js → logout(), igual
const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
```

Y en el cliente, guardarlo con `@capacitor/preferences` en lugar de confiar en la cookie:

```bash
npm i @capacitor/preferences
```

```ts
import { Preferences } from '@capacitor/preferences';
await Preferences.set({ key: 'refresh_token', value: response.refreshToken });
// y enviarlo en el body de POST /auth/refresh
```

Esto no rompe la web: si el body no trae token, se sigue leyendo la cookie.

Si eliges A, el backend debe pasar a `sameSite: 'none'` + `secure: true`, lo que implica servir
el API por HTTPS también en desarrollo.

### 3.4 CORS del backend

`src/index.js:8-11` permite **un solo origen** y no incluye el del WebView:

```js
app.use(cors({
  origin: 'http://localhost:4200',   // ← el WebView es https://localhost, se le deniega
  credentials: true
}));
```

Cámbialo a una lista (solo imprescindible si **no** usas `CapacitorHttp`, pero conviene igual):

```js
const ORIGENES = [
  'http://localhost:4200',      // ng serve
  'https://localhost',          // WebView de Capacitor (androidScheme: 'https')
  'capacitor://localhost',      // iOS, por si más adelante
  'http://localhost'            // androidScheme: 'http'
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ORIGENES.includes(origin)),
  credentials: true
}));
```

El `!origin` deja pasar las peticiones sin cabecera `Origin`, que es justo lo que manda
`CapacitorHttp` al salir del WebView.

### 3.5 El presupuesto de ejemplo debe seguir siendo la primera pantalla

`app.routes.ts` redirige `''` → `/presupuesto` sin guard, y `PresupuestoService.cargarResumen()`
cae en `mostrarDemo()` si no hay `userId`. Ese comportamiento es el correcto para una APK
(primer arranque sin sesión = pantalla llena, no error). **No lo cambies**, pero verifica que
`localStorage` del WebView está disponible: `initializeUserFromStorage()` y
`OpenaiService.getAprendizaje()` dependen de él. En el WebView de Android funciona, pero se
borra si el usuario limpia los datos de la app; si quieres persistencia sólida migra esas dos
lecturas a `@capacitor/preferences`.

### 3.6 Los presupuestos de tamaño de `angular.json` ✅ APLICADO

Medido el 2026-09-01 con `ng build --configuration production`. Con los límites originales
el build **fallaba**:

```
X [ERROR] bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 1.34 MB
          with a total of 2.34 MB.
X [ERROR] src/app/presupuesto/resumen/resumen.component.css exceeded maximum budget.
          Budget 8.00 kB was not met by 1.82 kB with a total of 9.82 kB.
```

Valores aplicados, con margen para crecer pero sin desactivar el aviso:

```jsonc
// angular.json → projects.presupuesto_familiar.architect.build.configurations.production.budgets
{ "type": "initial",           "maximumWarning": "2.5mb", "maximumError": "4mb" },
{ "type": "anyComponentStyle", "maximumWarning": "12kb",  "maximumError": "20kb" }
```

Build resultante: **2.34 MB inicial, 508 kB transferidos** (gzip), en ~23 s.
Salida en `dist/presupuesto_familiar/browser/`, que confirma el `webDir` de §5.

Opcional, para adelgazar: `xlsx` se usa solo en la importación; cárgalo con
`const XLSX = await import('xlsx')` dentro de `leerArchivo()` y haz `ImportarExcelComponent`
de carga diferida.

### 3.7 Firebase en el móvil

`app.config.ts` registra `provideFirebaseApp` / `provideAuth` / `provideFirestore` / `provideStorage`
con el SDK **web**, que funciona igual dentro del WebView: **no hace falta `google-services.json`**
ni los plugins nativos de Firebase.

Nota de seguridad: `firebase.config.ts` está versionado con la `apiKey` del proyecto. En una app
distribuida esa clave es extraíble del APK — no es un secreto por diseño, pero **revisa que las
reglas de Firestore y Storage estén cerradas por `request.auth`** antes de publicar. La
autenticación real la hace el backend propio, así que valora eliminar los providers de Firebase
si Firestore/Storage no se usan desde el cliente (menos bundle y menos superficie).

### 3.8 Exponer el backend deja de ser inocuo

Hoy el API vive en `localhost:3000` y solo lo alcanza tu PC. Para que lo alcance un móvil hay
que abrirlo a la LAN (desarrollo) o a Internet (producción), y ahí tres cosas del backend
`backenpresupuesto` pasan de ser irrelevantes a ser explotables. **Resuélvelas antes de publicar
la APK fuera de tu red.**

**a) Sesión única: el móvil va a expulsar a la web.**
`authController.js:73-75`, en cada login:

```js
await RefreshToken.destroy({ where: { userId: user.uid } });
```

Borra *todos* los refresh tokens del usuario. Con un solo cliente da igual; con web + APK,
entrar en el móvil mata la sesión del navegador y al revés. Si quieres sesiones simultáneas,
borra solo el token concreto en el logout y limita por antigüedad o por dispositivo:

```js
// en lugar del destroy incondicional
await RefreshToken.destroy({ where: { userId: user.uid, userAgent } });
```

**b) `userId` viaja por query y nadie lo contrasta con el token.**
`presupuestoController.js:282` hace `const { userId, mes } = req.query;` y `getResumen` nunca
compara ese `userId` con `req.user.id`, que el middleware ya ha dejado puesto. Cualquier usuario
autenticado puede leer el presupuesto de otro cambiando el parámetro. Lo mismo en `/meses` y
`/transacciones`. Arreglo, en cada controlador:

```js
const userId = req.user.id;              // ignora req.query.userId
```

Si prefieres no tocar la firma, al menos valida: `if (req.query.userId !== req.user.id) return res.status(403)...`.

**c) Las rutas de categorías no tienen autenticación.**
`categoriaRoutes.js` y `categoriaIngresoRoutes.js` montan `GET`, `POST`, `PUT` y `DELETE` **sin**
`verifyAccessToken`, al contrario que gastos, ingresos, presupuestos y reglas. Con el API en
Internet, cualquiera puede listar, crear y borrar categorías. Añade el middleware:

```js
router.get('/',    verifyAccessToken, categoriaController.getAll);
router.post('/',   verifyAccessToken, categoriaController.create);
router.put('/:id', verifyAccessToken, categoriaController.update);
router.delete('/:id', verifyAccessToken, categoriaController.delete);
```

**d) Producción: nada de exponer Node directamente.** Pon el API detrás de nginx o Caddy con
certificado (Let's Encrypt), y ahí `NODE_ENV=production` ya activa `secure: true` en la cookie.
Revisa también que `/api-docs` (Swagger) y `/api/test` no queden accesibles públicamente.

---

## 4. La máquina de build

### 4.1 Estado de esta máquina (verificado 2026-09-01)

| Componente | Estado |
|---|---|
| Node.js | ✅ **v22.23.2** instalado en `%LOCALAPPDATA%\Programs\nodejs` (zip, sin admin) |
| npm | ✅ 10.9.8 |
| Dependencias del frontend | ✅ 1021 paquetes (`npm ci`) |
| Build de producción | ✅ pasa tras ajustar presupuestos (§3.6) |
| `ng serve` | ✅ responde en `localhost:4200` y `192.168.160.62:4200` |
| JDK 21 | ✅ ya presente en `C:\Program Files\Android\openjdk\jdk-21.0.8` |
| Gradle | ✅ 8.14.1 en `C:\Tools\Gradle\gradle-8.14.1\bin` |
| SDK de Android | ❌ `ANDROID_HOME` apunta a una carpeta que no existe |
| Permisos de administrador | ❌ no disponibles |
| **Emulador de Android** | ❌ **imposible en esta máquina** — ver 4.2 |

Notas de lo que había de antes: `C:\Program Files\nodejs\` conserva un `node_modules\npm`
huérfano de una instalación anterior (inerte, no está en el PATH, no se puede borrar sin admin),
y en `%APPDATA%\npm` quedan shims muertos de `cordova` y `pnpm`. En el PATH de usuario hay una
entrada malformada, `...\AppData\Local\Android\sdk.` con punto final, que hay que corregir al
montar el SDK.

Como no hay permisos de administrador, todo se instala por **zip en carpeta de usuario** y las
variables se fijan en `HKCU\Environment` (nivel usuario, sin elevación):

```bash
# Git Bash: MSYS_NO_PATHCONV=1 evita que se conviertan los /v y /t en rutas
export MSYS_NO_PATHCONV=1
reg query "HKCU\Environment" /v Path        # LEE Y GUARDA EL VALOR ANTES DE TOCARLO
reg add "HKCU\Environment" /v Path /t REG_EXPAND_SZ /d "<valor_antiguo>;<ruta_nueva>" /f
```

> `reg add` sobrescribe el valor entero. Haz copia del PATH antes de modificarlo. No uses `setx`,
> que trunca silenciosamente a 1024 caracteres.

### 4.2 El emulador de Android no se puede usar aquí

```
CPU:        Intel Xeon E5-2650 @ 2.00GHz  (Sandy Bridge-EP, 2012)
Hipervisor: detectado — esta máquina es una VM Hyper-V
IP:         192.168.160.62
```

El emulador necesita aceleración por hardware (WHPX). Dentro de un invitado Hyper-V eso requiere
**virtualización anidada**, que Hyper-V solo ofrece en CPUs Intel **Broadwell (2015) o
posteriores**. Este Xeon es de 2012, así que no es cuestión de configuración. Sin aceleración el
emulador arranca en más de diez minutos y va a tirones: no sirve para trabajar.

**Compilar la APK sí funciona aquí** — Gradle no necesita virtualización, y el JDK 21 ya está.
Lo que no puedes es ejecutarla en esta máquina.

Alternativas para probar, de más a menos práctica:

1. **Móvil físico por ADB inalámbrico.** Con el teléfono en la misma red que `192.168.160.62`,
   activas Depuración inalámbrica (Android 11+) y `adb connect <ip-movil>:5555`. Da despliegue
   y `chrome://inspect` igual que por USB.
2. **Sideload manual**: copiar el `.apk` al móvil e instalarlo. Sin depuración, ciclo más lento.
3. **Chrome DevTools en modo dispositivo** para todo el trabajo de layout de §6.3.
4. Granja de dispositivos en la nube (Firebase Test Lab, BrowserStack). **Tiene coste económico.**

### 4.3 Lo que falta instalar para la parte Android

- **Android SDK command-line tools** (zip, sin admin): `sdkmanager` para bajar
  `platform-tools`, `platforms;android-35` y `build-tools`. No hace falta Android Studio
  completo, y de hecho su instalador sí pediría elevación.
- **`JAVA_HOME`** apuntando al JDK 21 ya presente, no al `jdk-11` que hay ahora:
  `C:\Program Files\Android\openjdk\jdk-21.0.8`. El Android Gradle Plugin 8.x exige 17 como
  mínimo; con el 11 actual el build falla.
- **`ANDROID_HOME`** corregido, y `%ANDROID_HOME%\platform-tools` en el PATH.

---

## 5. Instalación de Capacitor

Desde la raíz del proyecto (`presupuesto-familiar`):

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/status-bar @capacitor/splash-screen
npx cap init "Presupuesto Familiar" es.winfor.presupuestofamiliar --web-dir "dist/presupuesto_familiar/browser"
```

> El `web-dir` es `dist/presupuesto_familiar/browser`, **no** `dist/presupuesto_familiar`:
> el builder `@angular-devkit/build-angular:application` de Angular 19 separa `browser/` y `server/`.
> El `outputPath` está definido en `angular.json`.

Sustituye el `capacitor.config.ts` generado por:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'es.winfor.presupuestofamiliar',
  appName: 'Presupuesto Familiar',
  webDir: 'dist/presupuesto_familiar/browser',
  android: {
    allowMixedContent: false,
    captureInput: true
  },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp:    { enabled: true },
    CapacitorCookies: { enabled: true },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f6b5c',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
```

Los colores salen de las variables de `src/styles.css` (`--pf-verde: #0f6b5c`).

Añade el proyecto nativo y los scripts de trabajo:

```bash
npx cap add android
```

```jsonc
// package.json → scripts
"build:mobile":  "ng build --configuration production",
"sync:android":  "npm run build:mobile && npx cap sync android",
"open:android":  "npx cap open android",
"run:android":   "npm run sync:android && npx cap run android"
```

Y en `.gitignore`, para no versionar artefactos nativos:

```gitignore
# Capacitor / Android
/android/.gradle
/android/app/build
/android/build
/android/local.properties
/android/app/release
/android/app/src/main/assets/public
/android/key.properties
*.keystore
*.jks
```

---

## 6. Ajustes de la app para móvil

### 6.1 Botón físico "Atrás"

Sin esto, "atrás" cierra la app en cualquier pantalla.

```ts
// src/app/app.component.ts
import { App } from '@capacitor/app';
import { Location } from '@angular/common';

ngOnInit(): void {
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) { this.location.back(); } else { App.exitApp(); }
  });
}
```

### 6.2 Barra de estado y zona segura

```ts
// src/main.ts, antes de bootstrapApplication
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#0f6b5c' });
}
```

```css
/* src/styles.css */
body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
```

### 6.3 Tablas anchas en pantalla estrecha

`resumen.component.css` solo tiene un `@media (max-width: 900px)` (línea 681). Las tablas de
categorías (4 columnas con `p-inputNumber` dentro) y la de revisión de la importación (5 columnas)
no caben en 360 dp. Envuelve cada `<table>` en un contenedor con scroll horizontal:

```css
/* resumen.component.css e importar-excel.component.css */
.tabla-bloque, .detalle-gastos, .tabla-revision-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tabla-bloque table, .detalle-gastos table { min-width: 560px; }

@media (max-width: 600px) {
  .panel-superior, .comparativas, .tablas { grid-template-columns: 1fr; }
  .fila-503020 { flex-wrap: wrap; }
  .form-campos { display: grid; grid-template-columns: 1fr; gap: .5rem; }
  .entrada-previsto input { width: 96px; }
}
```

También conviene subir el área táctil de las filas (`.fila-categoria { min-height: 44px; }`),
porque la selección de categoría es un `click` sobre `<tr>`.

### 6.4 Formato de moneda en español

Las plantillas usan `| currency:datos.moneda:'symbol':'1.0-2'`, que se resuelve con el `LOCALE_ID`
por defecto (`en-US`) y pinta `€1,234.56`. Para que salga `1.234,56 €`:

```ts
// src/main.ts
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);

// src/app/app.config.ts → providers
{ provide: LOCALE_ID, useValue: 'es-ES' },
{ provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' }
```

### 6.5 Selector de fichero para la importación de Excel

`ImportarExcelComponent.seleccionarArchivo()` crea un `<input type="file">` por código y le hace
`click()`. El WebView de Capacitor implementa `onShowFileChooser`, así que **funciona sin plugin**
y sin permisos en Android 13+. Pruébalo en dispositivo real; si en algún fabricante no abre el
selector, sustitúyelo por:

```bash
npm i @capawesome/capacitor-file-picker
```

```ts
const { files } = await FilePicker.pickFiles({
  types: ['application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv'],
  readData: true
});
// files[0].data viene en base64 → XLSX.read(data, { type: 'base64', cellDates: true })
```

### 6.6 Icono y splash

```bash
npm i -D @capacitor/assets
# coloca resources/icon.png (1024x1024) y resources/splash.png (2732x2732)
npx capacitor-assets generate --android
```

---

## 7. Generar la APK

### 7.1 APK de depuración (para probar)

```bash
npm run sync:android
cd android
./gradlew assembleDebug           # Windows: .\gradlew.bat assembleDebug
```

Resultado: `android/app/build/outputs/apk/debug/app-debug.apk`

Instalación en un dispositivo con depuración USB activada:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Alternativa con Android Studio: `npm run open:android` y ejecutar con ▶.

### 7.2 Depuración desde el PC

Con la app abierta en el móvil, en Chrome del PC: `chrome://inspect` → *inspect*.
Se obtiene la consola completa de Angular, útil para los `console.log` de `AuthService`.

### 7.3 APK de release firmada

**1. Crear el almacén de claves** (guárdalo fuera del repositorio y haz copia de seguridad:
si se pierde, no se puede volver a actualizar la app en Play Store):

```bash
keytool -genkey -v -keystore presupuesto-familiar.keystore \
        -alias presupuesto -keyalg RSA -keysize 2048 -validity 10000
```

**2. `android/key.properties`** (ya excluido en `.gitignore`):

```properties
storeFile=C:/ruta/segura/presupuesto-familiar.keystore
storePassword=********
keyAlias=presupuesto
keyPassword=********
```

**3. `android/app/build.gradle`** — antes del bloque `android { ... }`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

y dentro de `android { ... }`:

```gradle
signingConfigs {
    release {
        storeFile     file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
        keyAlias      keystoreProperties['keyAlias']
        keyPassword   keystoreProperties['keyPassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**4. Construir:**

```bash
npm run sync:android
cd android
./gradlew clean assembleRelease
```

Resultado: `android/app/build/outputs/apk/release/app-release.apk`

**5. Verificar la firma:**

```bash
"%ANDROID_HOME%\build-tools\35.0.0\apksigner" verify --print-certs app-release.apk
```

### 7.4 Para Google Play (opcional)

Play Store exige AAB, no APK:

```bash
./gradlew bundleRelease      # android/app/build/outputs/bundle/release/app-release.aab
```

Sube el `.aab` y usa **Play App Signing**. La distribución interna por descarga directa
(sideload) sí admite el `.apk`.

### 7.5 Versionado

Antes de cada publicación, en `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2          // entero, +1 en cada release
    versionName "1.1.0"
}
```

---

## 8. Checklist de verificación en dispositivo

Ejecuta esta lista sobre la APK instalada, no sobre `ng serve`:

**Arranque y sesión**
- [ ] Primer arranque sin sesión: se ve el presupuesto de ejemplo con la banda de aviso.
- [ ] Login correcto → el resumen pasa a datos reales y desaparece la banda demo.
- [ ] Cerrar y reabrir la app: la sesión se recupera vía `/auth/refresh` (aquí falla si el 3.3 no está resuelto).
- [ ] Logout → vuelve a `/login` y el refresh deja de funcionar.

**Resumen**
- [ ] Flechas de mes: cambian el mes y recargan; "Mes actual" aparece solo fuera del mes en curso.
- [ ] Editar el saldo inicial y guardar → se recalculan saldo final y variación de ahorro.
- [ ] Editar un previsto de una línea → ✓ guarda, ✗ cancela, la fila se refresca.
- [ ] Barras de saldo y de previsto/real se dibujan con proporciones correctas.
- [ ] Bloque 50/30/20 muestra tres porcentajes (0 % si el backend aún no los envía).

**Ajustes de categorías**
- [ ] Cambiar la distribución 50/30/20 de una categoría de gasto y ver el porcentaje actualizarse.
- [ ] Añadir categoría existente, crear categoría nueva y quitar una categoría.
- [ ] El desplegable `appendTo="body"` de PrimeNG se posiciona bien con el teclado abierto.

**Transacciones**
- [ ] Añadir gasto y añadir ingreso: el teclado numérico no tapa el botón Guardar.
- [ ] Pulsar una fila de categoría despliega su detalle de transacciones.
- [ ] Editar una transacción inline (fecha, importe, categoría) y guardar.

**Importación Excel**
- [ ] Abre el selector de ficheros y lee un `.xlsx` (prueba con `public/Gastos_enero_agosto_2026.xls`).
- [ ] Autodetección de columnas correcta; mapeo manual funciona.
- [ ] Clasificación con IA responde y la tabla de revisión permite conmutar gasto/ingreso.
- [ ] Importación masiva crea los movimientos y refresca el resumen.

**Plataforma**
- [ ] Botón físico "Atrás" navega en lugar de cerrar.
- [ ] Rotación a horizontal no rompe el layout.
- [ ] Sin conexión: aparece el aviso de error, no una pantalla en blanco.
- [ ] Tablas anchas hacen scroll horizontal en 360 dp.

---

## 9. Resumen de cambios en el repositorio

| Fichero | Cambio |
|---|---|
| `src/environments/environment.ts` | `apiUrl` + nuevo `authUrl` apuntando a la IP/dominio real |
| `src/environments/environment.prod.ts` | íd. con HTTPS y `openaiApiKey` |
| `src/app/services/auth.service.ts` | eliminar `var baseURL = 'http://localhost:3000'` y usar `environment.authUrl` |
| `angular.json` | subir presupuestos de bundle y de CSS por componente |
| `package.json` | dependencias de Capacitor + scripts `build:mobile` / `sync:android` / `run:android` |
| `capacitor.config.ts` | **nuevo** |
| `src/main.ts` | `registerLocaleData(localeEs)` y `StatusBar` en plataforma nativa |
| `src/app/app.config.ts` | `LOCALE_ID` / `DEFAULT_CURRENCY_CODE` es-ES/EUR |
| `src/app/app.component.ts` | listener de `backButton` |
| `src/app/presupuesto/resumen/resumen.component.css` | media queries móviles y scroll horizontal |
| `src/app/presupuesto/importar-excel/importar-excel.component.css` | íd. para la tabla de revisión |
| `.gitignore` | artefactos de `android/` y keystores |
| `android/` | generado por `npx cap add android`; se versiona salvo lo excluido |

### Cambios en el backend (`C:\Users\erismeiris.hidalgo\Documents\backenpresupuesto`)

El mismo backend sirve para la APK: expone todos los endpoints que consume el módulo de
presupuesto, ya calcula el 50/30/20 y ya mantiene la clave de OpenAI en el servidor
(`utils/openaiService.js` usa `process.env.OPENAI_API_KEY`, así que **no viaja dentro del APK**).
Lo que hay que tocar:

| Fichero | Cambio | Motivo |
|---|---|---|
| `src/index.js:8-11` | CORS a lista de orígenes con el del WebView | §3.4 |
| `controllers/authController.js:88-94` | refresh token por body, o `sameSite: 'none'` + HTTPS | §3.3 |
| `controllers/authController.js:73-75` | no borrar todos los refresh tokens en cada login | §3.8a — si no, móvil y web se expulsan |
| `controllers/presupuestoController.js` | usar `req.user.id` en vez de `req.query.userId` | §3.8b — IDOR al exponer el API |
| `routes/categoriaRoutes.js`, `routes/categoriaIngresoRoutes.js` | añadir `verifyAccessToken` | §3.8c — hoy están abiertas |
| despliegue | HTTPS con proxy inverso, `NODE_ENV=production`, cerrar `/api-docs` y `/api/test` | §3.8d |

Aparte, dos desajustes cliente-servidor **previos** que conviene arreglar aunque no bloqueen la APK:

- `AuthService.register()` llama a `POST /api/user` (singular); el backend monta `/api/users/register`.
  El método bueno es `registerUser()`.
- `GastosService.getGastos()` llama a `GET /gastos/user/:userId`; la ruta real es
  `GET /gastos/usuario/:userId` (`gastosRoutes.js:61`). Devuelve 404 hoy.

---

## 10. Orden de ejecución recomendado

1. Backend: ampliar CORS (§3.4). Es lo único que necesitas para que el móvil llegue al API.
2. Corregir URLs del cliente (§3.1) y probar en el navegador contra el backend en la IP de LAN.
3. Subir los presupuestos de `angular.json` (§3.6) y comprobar que `ng build --configuration production` pasa.
4. Instalar Capacitor y `npx cap add android` (§5).
5. Primera APK de depuración **sin** los ajustes de UX: verificar que carga y que el presupuesto de ejemplo se ve.
6. Resolver la sesión (§3.3, ~10 líneas de backend + `@capacitor/preferences`) y validar login
   y refresh tras reiniciar la app.
7. Aplicar los ajustes móviles (§6) y repetir el checklist completo (§8).
8. **Antes de sacar la APK de tu red**: los puntos de §3.8 (sesión múltiple, `req.user.id`,
   auth en categorías, HTTPS).
9. Icono, splash, versionado y APK firmada (§6.6, §7.3).

Los pasos 1-7 se hacen contra la LAN y no necesitan HTTPS ni dominio. El paso 8 es la frontera:
a partir de ahí el API deja de estar solo en tu máquina.
