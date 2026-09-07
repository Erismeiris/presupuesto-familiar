// Producción web: el frontend se sirve desde presupuesto.aresolutions.es y la
// API vive en su propio subdominio, en el VPS, así que la URL tiene que ser
// absoluta. Antes era relativa porque se daba por hecho un reverse proxy que
// sirviera ambos bajo el mismo dominio.
//
// El prefijo /api es obligatorio: la raíz del VPS responde, pero
// `/presupuestos/resumen` sin /api devuelve 404.
//
// Sobre la cookie httpOnly del refresh, que es lo delicado de este cambio: la
// llamada pasa a ser cross-origin, pero sigue siendo **same-site**, porque
// SameSite se calcula sobre el dominio registrable (aresolutions.es) y es el
// mismo para el frontend y la API. La cookie se sigue enviando con SameSite=Lax
// sin tocar nada. Lo que sí hace falta es CORS con
// `Access-Control-Allow-Credentials: true` y el origen en lista blanca; el VPS ya
// responde así (comprobado el 2026-09-07).
export const environment = {
  production: true,
  apiUrl: 'https://api.presupuesto.aresolutions.es/api'
};
