// Desarrollo con `ng serve`. La ruta es relativa y el dev-server la reenvía a
// http://localhost:3000 mediante proxy.conf.json, de modo que el navegador ve
// un único origen: sin CORS y las cookies httpOnly de sesión funcionan.
//
// Se queda apuntando al backend local a propósito, aunque la API ya esté en el
// VPS: desarrollar contra el VPS es escribir en los datos de verdad. Para
// hacerlo puntualmente, basta cambiar el `target` de proxy.conf.json a
// https://api.presupuesto.aresolutions.es añadiendo `"changeOrigin": true`.
//
// Mejor por el proxy que apuntando `apiUrl` al VPS directamente: con el proxy el
// navegador sigue viendo un solo origen y la cookie del refresh es de primera
// parte. Si se salta el proxy, localhost y aresolutions.es son sitios distintos,
// la cookie pasa a ser de terceros y el refresh dejaría de funcionar salvo que el
// backend la marque SameSite=None.
export const environment = {
  production: false,
  apiUrl: '/api'
};
