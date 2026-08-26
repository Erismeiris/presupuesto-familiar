export type TipoMovimiento = 'gasto' | 'ingreso';

/** Clasificación de la categoría según la regla 50/30/20 */
export type TipoCategoria503020 = 'necesidades' | 'deseos' | 'ahorro';

/** Una fila de las tablas "Gastos" o "Ganancias" del resumen. */
export interface LineaResumen {
  lineaId: string | null;
  categoriaId: string | null;
  nombre: string;
  previsto: number;
  real: number;
  /** Positiva = desviación favorable, según el criterio de la plantilla. */
  diferencia: number;
  /** false para categorías con movimientos pero sin importe previsto. */
  presupuestada: boolean;
  /** Clasificación para la regla 50/30/20 */
  tipo503020?: TipoCategoria503020;
}

export interface BloqueResumen {
  previstoTotal: number;
  realTotal: number;
  diferenciaTotal: number;
  lineas: LineaResumen[];
}

/** La hoja "Resumen" completa, calculada por el backend. */
export interface ResumenMensual {
  presupuestoId: string;
  mes: string;
  moneda: string;
  saldoInicial: number;
  saldoFinal: number;
  ahorroMes: number;
  ahorroPrevisto: number;
  /** null cuando no hay saldo inicial con el que comparar. */
  variacionAhorroPct: number | null;
  gastos: BloqueResumen;
  ingresos: BloqueResumen;
  /** Porcentaje de necesidades (regla 50/30/20) */
  porcentajeNecesidades?: number;
  /** Porcentaje de deseos (regla 50/30/20) */
  porcentajeDeseos?: number;
  /** Porcentaje de ahorro (regla 50/30/20) */
  porcentajeAhorro?: number;
}

/** Una fila de la hoja "Transacciones". */
export interface Transaccion {
  id: string;
  tipo: TipoMovimiento;
  name: string;
  date: string;
  descripcion: string;
  monto: number;
  categoriaId: string | null;
  categoria: string;
  userId: string;
}

/** Alta de un movimiento, tal como lo esperan /api/gastos y /api/ingresos. */
export interface NuevaTransaccion {
  userId: string;
  categoriaId: string;
  date: string;
  descripcion: string;
  monto: number;
  name: string;
}

export interface LineaPresupuesto {
  id: string;
  presupuestoId: string;
  tipo: TipoMovimiento;
  categoriaId: string | null;
  nombre: string;
  previsto: number;
  orden: number;
}
