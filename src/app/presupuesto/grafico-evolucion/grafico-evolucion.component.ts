import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

import { CategoriaEvolucion } from '../../interface/presupuesto.interface';
import { nombreDelMes } from '../../services/presupuesto.service';

/** Meses con movimiento por debajo de los cuales no se dibuja la tendencia. */
const MINIMO_PARA_TENDENCIA = 4;

/** Inicial de cada mes para el eje horizontal. */
const INICIALES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

interface Punto {
  mes: string;
  indice: number;
  real: number;
  previsto: number;
  x: number;
  y: number;
  yPrevisto: number;
}

/**
 * Evolución de una categoría a lo largo de la ventana de meses, en SVG plano.
 *
 * SVG y no Chart.js a propósito: son doce puntos, dos series y una recta, y
 * así el gráfico usa los mismos tokens de color que el resto de la pantalla en
 * lugar de pelearse con el tema por defecto de una librería.
 */
@Component({
  selector: 'app-grafico-evolucion',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './grafico-evolucion.component.html',
  styleUrls: ['./grafico-evolucion.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraficoEvolucionComponent {
  /** null cuando la categoría no tiene ningún movimiento en la ventana. */
  readonly categoria = input.required<CategoriaEvolucion | null>();
  readonly meses = input.required<string[]>();
  /** Mes del primer movimiento del usuario, de toda su historia. */
  readonly primerMesConDatos = input.required<string | null>();
  /** El mes que se está viendo en el resumen, para marcarlo en el eje. */
  readonly mesEnPantalla = input.required<string>();
  readonly moneda = input<string>('EUR');

  // Lienzo en unidades de usuario; el SVG escala al ancho del panel.
  readonly ancho = 680;
  readonly alto = 180;
  // Margen derecho holgado: el ultimo punto es el mes que se esta viendo y lleva
  // su banda detras, que pegada al borde parecia un corte del dibujo.
  private readonly margen = { arriba: 14, derecha: 30, abajo: 26, izquierda: 62 };

  /**
   * Índice del primer mes de la ventana que cuenta como dato.
   *
   * Los meses anteriores al primer movimiento del usuario **no son ceros**: son
   * meses en los que no había nada que registrar. Pintarlos como ceros dibuja
   * una subida desde el origen que no ha ocurrido, y arrastra la recta de
   * tendencia con ella.
   */
  private readonly desde = computed(() => {
    const primero = this.primerMesConDatos();
    if (!primero) return -1;
    const indice = this.meses().findIndex((mes) => mes >= primero);
    return indice === -1 ? -1 : indice;
  });

  readonly puntos = computed<Punto[]>(() => {
    const categoria = this.categoria();
    const meses = this.meses();
    const desde = this.desde();
    if (!categoria || desde === -1) return [];

    const visibles = meses.length - desde;
    // Con un único mes visible el punto se pone en el centro; si no, se reparten
    // de borde a borde del área de dibujo.
    const util = this.ancho - this.margen.izquierda - this.margen.derecha;
    const paso = visibles > 1 ? util / (visibles - 1) : 0;

    return meses.slice(desde).map((mes, i) => {
      const real = categoria.porMes[desde + i] ?? 0;
      const previsto = categoria.previstoPorMes[desde + i] ?? 0;
      return {
        mes,
        indice: desde + i,
        real,
        previsto,
        x: this.margen.izquierda + (visibles > 1 ? paso * i : util / 2),
        y: this.aY(real),
        yPrevisto: this.aY(previsto)
      };
    });
  });

  /** El techo del eje vertical, redondeado hacia arriba para dar un número limpio. */
  readonly techo = computed(() => {
    const categoria = this.categoria();
    const desde = this.desde();
    if (!categoria || desde === -1) return 0;

    const valores = [
      ...categoria.porMes.slice(desde),
      ...categoria.previstoPorMes.slice(desde)
    ];
    const maximo = Math.max(0, ...valores);
    if (maximo === 0) return 0;

    const magnitud = Math.pow(10, Math.floor(Math.log10(maximo)));
    return Math.ceil(maximo / magnitud) * magnitud;
  });

  readonly hayPrevisto = computed(() =>
    this.puntos().some((punto) => punto.previsto !== 0));

  readonly lineaReal = computed(() =>
    this.puntos().map((p) => `${p.x},${p.y}`).join(' '));

  readonly lineaPrevisto = computed(() =>
    this.puntos().map((p) => `${p.x},${p.yPrevisto}`).join(' '));

  /** Meses de la ventana en los que la categoría movió algo. */
  readonly mesesConImporte = computed(() =>
    this.puntos().filter((punto) => punto.real !== 0).length);

  readonly suficientesParaTendencia = computed(() =>
    this.mesesConImporte() >= MINIMO_PARA_TENDENCIA);

  readonly minimoParaTendencia = MINIMO_PARA_TENDENCIA;

  /**
   * Recta de mínimos cuadrados sobre los meses que cuentan como dato, ceros
   * incluidos: un mes en el que no gastaste nada es información, siempre que ya
   * estuvieras usando la aplicación.
   *
   * null mientras no haya meses suficientes: con dos o tres puntos la recta
   * dibuja lo que se quiera y da una falsa sensación de saber algo.
   */
  readonly tendencia = computed(() => {
    if (!this.suficientesParaTendencia()) return null;

    const puntos = this.puntos();
    const n = puntos.length;
    const sumaX = puntos.reduce((acc, _, i) => acc + i, 0);
    const sumaY = puntos.reduce((acc, p) => acc + p.real, 0);
    const sumaXY = puntos.reduce((acc, p, i) => acc + i * p.real, 0);
    const sumaXX = puntos.reduce((acc, _, i) => acc + i * i, 0);

    const divisor = n * sumaXX - sumaX * sumaX;
    if (divisor === 0) return null;

    const pendiente = (n * sumaXY - sumaX * sumaY) / divisor;
    const corte = (sumaY - pendiente * sumaX) / n;

    return {
      pendiente,
      x1: puntos[0].x,
      y1: this.aY(corte),
      x2: puntos[n - 1].x,
      y2: this.aY(corte + pendiente * (n - 1))
    };
  });

  /**
   * La pendiente en palabras, que es lo que de verdad se lee. Por debajo del
   * 5 % de la media mensual el movimiento es ruido y se llama estable.
   */
  readonly tendenciaEnPalabras = computed(() => {
    const tendencia = this.tendencia();
    const categoria = this.categoria();
    if (!tendencia || !categoria) return null;

    const umbral = Math.max(1, categoria.media * 0.05);
    if (Math.abs(tendencia.pendiente) < umbral) return { estable: true, importe: 0 };

    return { estable: false, importe: Math.abs(tendencia.pendiente) };
  });

  readonly subiendo = computed(() => (this.tendencia()?.pendiente ?? 0) > 0);

  /** Índice del mes que se está viendo dentro de los puntos dibujados. */
  readonly puntoDelMesEnPantalla = computed(() =>
    this.puntos().find((punto) => punto.mes === this.mesEnPantalla()) ?? null);

  /** "2025-12" -> "diciembre de 2025". Un YYYY-MM crudo no se le ensena a nadie. */
  enPalabras(mes: string): string {
    return nombreDelMes(mes);
  }

  inicialDelMes(mes: string): string {
    return INICIALES[Number(mes.split('-')[1]) - 1] ?? '';
  }

  /** Enero se etiqueta con el año para que un salto de año se vea. */
  esEnero(mes: string): boolean {
    return mes.endsWith('-01');
  }

  anioDe(mes: string): string {
    return mes.split('-')[0];
  }

  get baseY(): number {
    return this.alto - this.margen.abajo;
  }

  get topeY(): number {
    return this.margen.arriba;
  }

  get izquierda(): number {
    return this.margen.izquierda;
  }

  get derecha(): number {
    return this.ancho - this.margen.derecha;
  }

  private aY(valor: number): number {
    const techo = this.techo();
    if (techo === 0) return this.baseY;
    const util = this.baseY - this.margen.arriba;
    return this.baseY - (valor / techo) * util;
  }
}
