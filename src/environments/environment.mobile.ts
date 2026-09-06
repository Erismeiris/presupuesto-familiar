// APK Android. Aquí NO sirve una ruta relativa: el WebView de Capacitor se sirve
// desde https://localhost, así que '/api' apuntaría al propio teléfono.
// Debe ser siempre una URL absoluta alcanzable desde el móvil.
export const environment = {
  production: true,
  apiUrl: 'http://192.168.160.62:3000/api'
};
