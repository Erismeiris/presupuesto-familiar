/**
 * Datos del titular que aparecen en las páginas legales (términos y privacidad).
 *
 * Los valores marcados como PENDIENTE deben rellenarse antes de publicar la
 * aplicación: sin ellos las páginas no cumplen los requisitos de información
 * del RGPD ni de la LSSI. Mientras alguno siga pendiente, las páginas muestran
 * un aviso visible para que no pase inadvertido.
 */
export const DATOS_LEGALES = {
  nombreApp: 'Control de Presupuesto Familiar',
  titular: 'PENDIENTE: nombre o razón social del titular',
  nif: 'PENDIENTE: NIF / CIF',
  domicilio: 'PENDIENTE: dirección postal',
  emailContacto: 'PENDIENTE: correo de contacto',
  /** Buzón al que se dirigen las solicitudes de derechos del RGPD. */
  emailPrivacidad: 'PENDIENTE: correo para ejercer derechos',
  /** País cuya legislación rige y cuyos tribunales son competentes. */
  jurisdiccion: 'España',
  ultimaActualizacion: '2 de septiembre de 2026'
} as const;

/** `true` mientras quede algún dato del titular sin rellenar. */
export function hayDatosLegalesPendientes(): boolean {
  return Object.values(DATOS_LEGALES).some((valor) => valor.startsWith('PENDIENTE'));
}
