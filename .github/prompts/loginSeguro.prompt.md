---
mode: edit
---
Estoy desarrollando un frontend en Angular 19 con standalone components y un backend en Node.js que implementa autenticación con:
- Access token (JWT) de corta duración (15 min) devuelto en el body.
- Refresh token de larga duración (7 días) enviado en cookie HttpOnly, Secure, SameSite=Strict, path=/refresh.

Quiero que modifiques en Angular:

1. Un servicio `AuthService` que:
   - Guarde el access token en memoria (BehaviorSubject).
   - Tenga métodos `login(username, password)`, `getAccessToken()`, `refreshToken()` y `logout()`.
   - Use `{ withCredentials: true }` en las peticiones para enviar la cookie del refresh token.
   - Llame a `/login` para iniciar sesión, `/refresh` para renovar el access token y `/logout` para cerrar sesión.

2. Un interceptor `AuthInterceptor` que:
   - Intercepte todas las peticiones HTTP.
   - Añada el header `Authorization: Bearer <accessToken>` si existe.
   - Si recibe un 401 o 403, llame automáticamente a `AuthService.refreshToken()` y reintente la petición original con el nuevo access token.

3. Un guard `AuthGuard` (`canActivate`) que:
   - Compruebe si hay un access token válido en memoria.
   - Si no hay token o está expirado, intente renovarlo con `refreshToken()`.
   - Si no se puede renovar, redirija a `/login`.

4. Ejemplo de configuración en `app.config.ts` para registrar el interceptor usando `provideHttpClient(withInterceptors([...]))`.

5. Ejemplo de uso del guard en la configuración de rutas standalone.

Usar buenas prácticas:
- Decodificar el JWT en el frontend para comprobar expiración (`exp`).
- Manejar errores de red y expiración de token.
- No guardar el access token en localStorage ni sessionStorage.
