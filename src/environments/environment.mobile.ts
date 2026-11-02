// APK Android. Aquí NO sirve una ruta relativa: el WebView de Capacitor se sirve
// desde https://localhost, así que '/api' apuntaría al propio teléfono.
// Debe ser siempre una URL absoluta alcanzable desde el móvil.
//
// La API es la Edge Function `api` de Supabase, la misma que usa la web (ver
// environment.prod.ts). Funciona desde cualquier conexión y sobre HTTPS.
export const environment = {
  production: true,
  apiUrl: 'https://fesugweeqybrjtsbvuyl.supabase.co/functions/v1/api'
};
