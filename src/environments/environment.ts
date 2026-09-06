// Desarrollo con `ng serve`. La ruta es relativa y el dev-server la reenvía a
// http://localhost:3000 mediante proxy.conf.json, de modo que el navegador ve
// un único origen: sin CORS y las cookies httpOnly de sesión funcionan.
export const environment = {
  production: false,
  apiUrl: '/api'
};
