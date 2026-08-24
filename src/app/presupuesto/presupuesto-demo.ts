import {
  BloqueResumen,
  LineaResumen,
  ResumenMensual,
  TipoMovimiento
} from '../interface/presupuesto.interface';

/**
 * Presupuesto de ejemplo para quien entra sin cuenta: la pantalla se ve llena y
 * se entiende de un vistazo, sin tocar el backend.
 *
 * Los totales y las diferencias no se escriben a mano, se calculan igual que en
 * el controlador del servidor, para que las cifras del ejemplo cuadren entre sí
 * exactamente como cuadran las de verdad.
 */

/** [nombre, previsto, real]. Un previsto de 0 sale marcado como "sin previsión". */
type FilaDemo = [string, number, number];

const GASTOS_DEMO: FilaDemo[] = [
  ['Comida', 450, 478.35],
  ['Regalos', 60, 45],
  ['Salud/médicos', 80, 62.4],
  ['Vivienda', 850, 850],
  ['Transporte', 180, 205.7],
  ['Gastos personales', 150, 132.9],
  ['Mascotas', 45, 51.2],
  ['Suministros (luz, agua, gas, etc.)', 210, 236.8],
  ['Viajes', 100, 0],
  ['Deuda', 320, 320],
  ['Otros', 55, 38.6],
  ['Suscripciones', 0, 24.99]
];

const INGRESOS_DEMO: FilaDemo[] = [
  ['Ahorro', 200, 200],
  ['Sueldo', 2600, 2600],
  ['Bonificaciones', 0, 150],
  ['Intereses', 15, 18.4],
  ['Otros', 0, 60]
];

const SALDO_INICIAL_DEMO = 1850;

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

const construirBloque = (tipo: TipoMovimiento, filas: FilaDemo[]): BloqueResumen => {
  const lineas: LineaResumen[] = filas.map(([nombre, previsto, real], indice) => ({
    lineaId: `demo-${tipo}-${indice}`,
    categoriaId: null,
    nombre,
    previsto,
    real,
    // Mismo criterio que la plantilla: positivo cuando la desviación es favorable.
    diferencia: redondear(tipo === 'ingreso' ? real - previsto : previsto - real),
    presupuestada: previsto > 0
  }));

  const previstoTotal = redondear(lineas.reduce((total, linea) => total + linea.previsto, 0));
  const realTotal = redondear(lineas.reduce((total, linea) => total + linea.real, 0));

  return {
    previstoTotal,
    realTotal,
    diferenciaTotal: redondear(tipo === 'ingreso' ? realTotal - previstoTotal : previstoTotal - realTotal),
    lineas
  };
};

/** Resumen de ejemplo del mes indicado. Las cifras no cambian de un mes a otro. */
export const resumenDemo = (mes: string): ResumenMensual => {
  const gastos = construirBloque('gasto', GASTOS_DEMO);
  const ingresos = construirBloque('ingreso', INGRESOS_DEMO);

  const ahorroMes = redondear(ingresos.realTotal - gastos.realTotal);

  return {
    presupuestoId: 'demo',
    mes,
    moneda: 'EUR',
    saldoInicial: SALDO_INICIAL_DEMO,
    saldoFinal: redondear(SALDO_INICIAL_DEMO + ahorroMes),
    ahorroMes,
    ahorroPrevisto: redondear(ingresos.previstoTotal - gastos.previstoTotal),
    variacionAhorroPct: redondear((ahorroMes / SALDO_INICIAL_DEMO) * 100),
    gastos,
    ingresos
  };
};
