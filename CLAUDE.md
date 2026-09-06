# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

El código, los comentarios y la documentación de este repositorio están en español.
Mantén ese idioma al escribir código nuevo o documentación.

## Comandos

```bash
npm start                 # ng serve en localhost:4200, con proxy de /api a localhost:3000
npm run build             # build de producción (configuración por defecto)
npm test                  # Karma + Jasmine en navegador, modo watch

# Un solo fichero de test
npx ng test --include=src/app/auth/login/login.component.spec.ts
npx ng test --watch=false --browsers=ChromeHeadless   # una pasada, para CI o verificación

# Android / APK
npm run build:mobile      # build con environment.mobile.ts
npm run sync:android      # build:mobile + npx cap sync android
npm run open:android      # abre el proyecto en Android Studio
npm run run:android       # sync + despliegue en dispositivo conectado
```

No hay linter configurado (`ng lint` no está instalado) ni tests e2e.

## Arquitectura

### Este repo es solo el frontend

Angular 19 standalone (sin NgModules) + PrimeNG (tema Aura, sin modo oscuro).
**Toda la lógica de dominio vive en el backend**, que es un repositorio aparte:
`C:\Users\erismeiris.hidalgo\Documents\backenpresupuesto` (Express + PostgreSQL,
escucha en el puerto 3000). Cálculos como `saldoFinal`, `ahorroMes`, los
porcentajes 50/30/20 o el desglose por categorías llegan ya resueltos en la
respuesta de `GET /presupuestos/resumen`; el frontend no los recalcula.

Al tocar una funcionalidad, comprueba si el cambio real corresponde al backend.
El inventario de endpoints consumidos está en `INSTRUCCIONES_APK_ANDROID.md` §1.3.

### Los tres entornos y `apiUrl`

`angular.json` hace *file replacement* de `src/environments/environment.ts` según
la configuración de build, y lo único que cambia es `apiUrl`:

| Configuración | Fichero | `apiUrl` | Por qué |
|---|---|---|---|
| `development` (`ng serve`) | `environment.ts` | `/api` | Relativa; `proxy.conf.json` la reenvía a `localhost:3000`. Mismo origen → sin CORS y las cookies funcionan |
| `production` | `environment.prod.ts` | `/api` | Reverse proxy sirve API y front bajo el mismo dominio |
| `mobile` | `environment.mobile.ts` | `http://192.168.160.62:3000/api` | **Debe ser absoluta**: en el WebView de Capacitor el origen es `https://localhost`, que es el propio teléfono |

La IP de `environment.mobile.ts` está fijada a la máquina de desarrollo actual y
hay que actualizarla si cambia la red.

### Autenticación: JWT propio, no Firebase

Firebase está *provisto* en `app.config.ts` (`provideFirebaseApp`, `provideAuth`,
`provideFirestore`, `provideStorage`) y `auth.service.ts` conserva imports de
`@angular/fire`, pero **no autentica a nadie**. Son restos de una versión anterior.
La sesión real es contra el backend:

- **Access token JWT en memoria** (`BehaviorSubject` en `AuthService`), nunca en
  `localStorage`. En `localStorage` solo se guarda la *identidad* (`user`), que
  no prueba que la sesión siga viva.
- **Refresh token en cookie httpOnly** que pone el backend, enviada con
  `withCredentials: true`.
- Al recargar la página **no hay access token**, así que `isAuthenticated()`
  devuelve `false` a propósito. Quien renueva son `authGuard`
  (`src/app/guards/auth.guard.ts`) y `authInterceptor`, llamando a
  `POST /auth/refresh`; ese endpoint devuelve también el usuario, con lo que se
  reconstruye la identidad aunque `localStorage` esté vacío.
- El interceptor reintenta una vez tras un 401/403 y, si el refresh falla,
  navega a `/login`. Excluye las rutas `/refresh` y `/login` para no entrar en bucle.

Cuidado al modificar `AuthService`: los comentarios largos de sus métodos
documentan bugs ya corregidos (sesión perdida en cada recarga, guard que daba
paso con sesiones muertas, `logout` que no invalidaba el refresh en servidor).
No revertirlos por accidente.

### Estado: signals en los servicios, no en los componentes

`PresupuestoService` (`providedIn: 'root'`) actúa como store compartido:
`mes`, `resumen`, `cargando`, `error`, `modoDemo`. Los componentes leen esas
señales y llaman a métodos del servicio; no mantienen copia del resumen.

El **mes se maneja siempre como `YYYY-MM`** y hay tres helpers exportados desde
el mismo fichero: `mesActual()`, `desplazarMes()`, `nombreDelMes()`. El backend
crea el mes si no existe al pedir su resumen.

### Modo demo

`/presupuesto` es la ruta de arranque (`''` y `**` redirigen ahí) y **no tiene
guard a propósito**. Sin `userId`, `cargarResumen()` pinta `resumenDemo(mes)` de
`presupuesto-demo.ts` en lugar de llamar al backend, y `modoDemo` pasa a `true`,
lo que bloquea las escrituras. Cualquier cambio en esa ruta debe preservar que un
visitante sin cuenta vea la pantalla funcionando.

### Dos zonas de la aplicación

- **`/presupuesto`** — la pantalla principal y el grueso del código.
  `resumen.component.ts` (~530 líneas) concentra saldo inicial, edición inline de
  previstos, panel de ajustes de categorías, distribución 50/30/20, detalle por
  categoría, alta de gasto/ingreso y los gráficos de barras (**CSS puro,
  `alturaBarras()` / `anchoBarra()` — no Chart.js**).
- **`/dashboard`** y `/invitations` — parte anterior (gastos, invitaciones entre
  usuarios, perfil), con su propio `header`/`main`. `presupuesto-page.component.ts`
  reutiliza el `HeaderComponent` del dashboard.

### Importación de movimientos

Dos vías, ambas con previsualización antes de escribir:

- **Excel/CSV** (`importar-excel.component.ts`): máquina de estados
  `idle → mapeo → clasificando → revision → importando`. Lee con `xlsx`,
  autodetecta columnas, normaliza fecha (DD/MM/YYYY → ISO) e importe (formato
  español e inglés), deduce el tipo por el signo, clasifica llamando a
  `POST /gastos/clasificar` y `POST /ingresos/clasificar`, y da de alta en bloque
  con `forkJoin`.
- **Correo IMAP** (`importar-correo.component.ts` + `config-correo.component.ts`):
  buzón compartido de la aplicación al que los usuarios reenvían los avisos de su
  banco. `ImapService.procesarCorreos(userId, dryRun)` con `dryRun: true` extrae y
  clasifica sin crear nada ni marcar los correos como leídos. El asunto y
  remitente no se mandan desde el cliente: manda la configuración guardada del
  usuario, la misma que usa el sync automático del backend.

### Localización

`app.config.ts` registra `localeEs` y fija `LOCALE_ID` a `es-ES`. Sin eso los
importes salen como `€1,657.28` en vez de `1.657,28 €`. Los pipes `currency` de
las plantillas dependen de esto.

## Capacitor / APK

`capacitor.config.ts` activa **`CapacitorHttp` y `CapacitorCookies`**: hacen las
peticiones fuera del WebView, con almacén de cookies propio, lo que resuelve a la
vez el problema de la cookie httpOnly de tercera parte y el de CORS. Parchean
`fetch` y `XMLHttpRequest`, así que `HttpClient`, el interceptor y los servicios
no cambian. No desactives esos plugins sin leer `INSTRUCCIONES_APK_ANDROID.md` §3.3.

`webDir` apunta a `dist/presupuesto_familiar/browser`, que es lo que produce
`build:mobile` — de ahí que `sync:android` encadene siempre build + sync.

**En esta máquina la APK se compila pero no se puede ejecutar**: es una VM
Hyper-V sobre un Xeon de 2012, sin virtualización anidada, así que el emulador de
Android es inviable. Para probar hace falta un móvil físico por ADB inalámbrico o
sideload. No hay permisos de administrador: todo se instala por zip en carpeta de
usuario y las variables van a `HKCU\Environment`. Detalles en
`INSTRUCCIONES_APK_ANDROID.md` §4.

## Documentos del repositorio

- `INSTRUCCIONES_APK_ANDROID.md` — el documento más completo y actualizado:
  inventario funcional, endpoints, bloqueantes para móvil, estado de la máquina
  de build y pasos para generar la APK. Consúltalo antes de tocar nada de Android.
- `ENCARGO_BACKEND_CORREO.md` — trabajo pendiente **en el backend** para que el
  buzón compartido funcione con varios usuarios (atribución por alias, marca de
  procesado por usuario). Describe bugs reales, no hipótesis.
- `ENCARGO_BACKEND_SALDO_INICIAL.md` — especificación para implementar **en el
  backend** el arrastre del saldo inicial: regla del ancla, recálculo en lectura y
  los cinco campos nuevos del resumen que este frontend consumirá.
- `IMPLEMENTACION_50-30-20.md` — **obsoleto**: describe trabajo ya hecho en el
  backend. No lo uses como referencia.

## Detalles a tener en cuenta

- **Guard duplicado**: `src/app/auth.guard.ts` es una clase `AuthGuard` heredada y
  sin usar. El guard vivo es el funcional de `src/app/guards/auth.guard.ts`.
- **Los `.spec.ts` son andamiaje del CLI**: solo comprueban que el componente se
  crea. No hay cobertura real, así que un `npm test` en verde no valida cambios
  de lógica.
- **`.vs/` está versionado** y ensucia el `git status` constantemente. Ignóralo al
  preparar commits.
- `firebase.config.ts` está en la raíz y versionado, fuera de `src/`.
