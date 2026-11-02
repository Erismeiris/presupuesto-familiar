// Producción web: el frontend se sirve desde presupuesto.aresolutions.es y la
// API es una Edge Function de Supabase (proyecto `presupuesto`), así que la URL
// tiene que ser absoluta.
//
// Termina en /api porque la función se llama `api` y declara sus rutas con el
// mismo prefijo que tenía el backend antiguo: .../functions/v1/api/auth/login.
//
// Sobre el refresh de la sesión: la API vive en supabase.co, un sitio distinto
// de aresolutions.es, así que la cookie httpOnly del refresh es de terceros y
// los navegadores no la envían (Safari nunca). Por eso el AuthService guarda el
// refreshToken que devuelve el login y lo manda en el cuerpo de /auth/refresh y
// /auth/logout, que el backend ya admitía. Si algún día la API pasa a un
// subdominio propio (Custom Domain de Supabase, plan Pro), basta cambiar esta URL.
export const environment = {
  production: true,
  apiUrl: 'https://fesugweeqybrjtsbvuyl.supabase.co/functions/v1/api'
};
