import {
  BloqueEvolucion,
  BloqueResumen,
  CategoriaEvolucion,
  Evolucion,
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
    presupuestada: previsto > 0,
    tipo
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

  // Calcular porcentajes 50/30/20 basados en gastos reales demo
  // Necesidades: Comida, Salud, Vivienda, Transporte, Suministros, Deuda
  const necesidades = 478.35 + 62.4 + 850 + 205.7 + 236.8 + 320;
  // Deseos: Regalos, Gastos personales, Mascotas, Otros, Suscripciones
  const deseos = 45 + 132.9 + 51.2 + 38.6 + 24.99;
  // Ahorro/inversión: Viajes (0 este mes)
  const ahorro = 0;
  
  const totalGastos = gastos.realTotal;
  
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
    ingresos,
    // Porcentajes de la regla 50/30/20
    porcentajeNecesidades: redondear((necesidades / totalGastos) * 100),
    porcentajeDeseos: redondear((deseos / totalGastos) * 100),
    porcentajeAhorro: redondear((ahorro / totalGastos) * 100)
  };
};

/* --- Evolución de ejemplo -------------------------------------------------
 *
 * El visitante sin cuenta tiene que poder abrir la pestaña de evolución y ver
 * el gráfico funcionando, igual que ve el resto de la pantalla: mandarlo a
 * "crea una cuenta" justo ahí sería un callejón sin salida en la única pantalla
 * pensada para engancharlo.
 *
 * La serie se deriva del importe real de cada categoría con una oscilación
 * determinista, así que el ejemplo es siempre el mismo y cuadra con las cifras
 * del mes que se ve arriba.
 */

/** Ventana de ejemplo: los doce meses que acaban en el mes que se está viendo. */
const ventanaDemo = (hasta: string, cuantos = 12): string[] => {
  const [anio, mes] = hasta.split('-').map(Number);
  return Array.from({ length: cuantos }, (_, i) => {
    const fecha = new Date(Date.UTC(anio, mes - 1 - (cuantos - 1 - i), 1));
    return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

/**
 * Oscilación estable alrededor del importe real, entre el 55 % y el 145 %.
 * Sin `Math.random()`: el ejemplo no puede cambiar entre dos recargas ni entre
 * dos visitantes, o la captura de pantalla de ayer dejaría de coincidir.
 */
const importeDelMes = (base: number, indice: number, semilla: number): number => {
  if (base === 0) return 0;
  const onda = Math.sin((indice + semilla) * 1.1) * 0.35 + Math.cos((indice + semilla) * 0.7) * 0.1;
  // Una ligera pendiente ascendente para que la tendencia tenga algo que decir.
  return redondear(base * (1 + onda) * (1 + indice * 0.012));
};

const construirBloqueEvolucion = (
  tipo: TipoMovimiento,
  filas: FilaDemo[],
  meses: string[]
): BloqueEvolucion => {
  const categorias: CategoriaEvolucion[] = filas.map(([nombre, previsto, real], indice) => {
    const porMes = meses.map((_, i) => importeDelMes(real, i, indice * 2.3));
    const previstoPorMes = meses.map(() => previsto);

    const total = redondear(porMes.reduce((acc, v) => acc + v, 0));
    const previstoTotal = redondear(previstoPorMes.reduce((acc, v) => acc + v, 0));
    const conImporte = porMes.filter((v) => v !== 0).length;

    let mesMaximo: { mes: string; importe: number } | null = null;
    porMes.forEach((importe, i) => {
      if (importe !== 0 && (mesMaximo === null || importe > mesMaximo.importe)) {
        mesMaximo = { mes: meses[i], importe };
      }
    });

    return {
      categoriaId: null,
      nombre,
      tipo,
      porMes,
      previstoPorMes,
      total,
      previstoTotal,
      diferenciaTotal: redondear(tipo === 'ingreso' ? total - previstoTotal : previstoTotal - total),
      media: conImporte > 0 ? redondear(total / conImporte) : 0,
      mesesConImporte: conImporte,
      mesMaximo,
      presupuestada: previsto > 0
    };
  });

  const sumarColumnas = (campo: 'porMes' | 'previstoPorMes') =>
    meses.map((_, i) => redondear(categorias.reduce((acc, c) => acc + c[campo][i], 0)));

  const porMes = sumarColumnas('porMes');
  const previstoPorMes = sumarColumnas('previstoPorMes');
  const total = redondear(porMes.reduce((acc, v) => acc + v, 0));
  const previstoTotal = redondear(previstoPorMes.reduce((acc, v) => acc + v, 0));

  return {
    total,
    previstoTotal,
    diferenciaTotal: redondear(tipo === 'ingreso' ? total - previstoTotal : previstoTotal - total),
    porMes,
    previstoPorMes,
    categorias
  };
};

/** Evolución de ejemplo de los doce meses que acaban en el mes indicado. */
export const evolucionDemo = (hasta: string): Evolucion => {
  const meses = ventanaDemo(hasta);
  const gastos = construirBloqueEvolucion('gasto', GASTOS_DEMO, meses);
  const ingresos = construirBloqueEvolucion('ingreso', INGRESOS_DEMO, meses);

  return {
    desde: meses[0],
    hasta,
    moneda: 'EUR',
    meses,
    // El ejemplo tiene los doce meses completos: es lo que hace que se vea el
    // gráfico lleno y con tendencia.
    primerMesConDatos: meses[0],
    mesesConPresupuesto: meses,
    gastos,
    ingresos,
    ahorroPorMes: meses.map((_, i) => redondear(ingresos.porMes[i] - gastos.porMes[i])),
    ahorroTotal: redondear(ingresos.total - gastos.total),
    ahorroPrevisto: redondear(ingresos.previstoTotal - gastos.previstoTotal)
  };
};
