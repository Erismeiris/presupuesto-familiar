// APK Android. Aquí NO sirve una ruta relativa: el WebView de Capacitor se sirve
// desde https://localhost, así que '/api' apuntaría al propio teléfono.
// Debe ser siempre una URL absoluta alcanzable desde el móvil.
//
// Con la API en el VPS, la APK deja de depender de la IP de la máquina de
// desarrollo en la red local, que había que actualizar a mano cada vez que
// cambiaba de red y obligaba a tener el móvil en la misma wifi. Ahora funciona
// desde cualquier conexión, y además sobre HTTPS, así que ya no hace falta
// permitir tráfico en claro en la configuración de red de Android.
export const environment = {
  production: true,
  apiUrl: 'https://api.presupuesto.aresolutions.es/api'
};
