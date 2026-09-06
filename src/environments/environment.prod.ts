// Producción web: la API se sirve bajo el mismo dominio que el frontend
// (reverse proxy en /api), así que la ruta relativa vale sin configurar nada.
export const environment = {
  production: true,
  apiUrl: '/api'
};
