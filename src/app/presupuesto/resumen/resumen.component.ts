import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import { ImportarExcelComponent } from '../importar-excel/importar-excel.component';

import { forkJoin } from 'rxjs';
import { Categoria } from '../../interface/categoria';
import { BloqueResumen, LineaResumen, NuevaTransaccion, TipoCategoria503020, Transaccion } from '../../interface/presupuesto.interface';
import { CategoriaService } from '../../services/categoria.service';
import { GastosService } from '../../services/gastos.service';
import {
  desplazarMes,
  mesActual,
  nombreDelMes,
  PresupuestoService
} from '../../services/presupuesto.service';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DropdownModule, InputNumberModule, InputTextModule, ImportarExcelComponent], // importar-excel incluido
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenComponent implements OnInit {
  private presupuestoService = inject(PresupuestoService);
  private categoriaService = inject(CategoriaService);
  private gastosService = inject(GastosService);

  readonly resumen = this.presupuestoService.resumen;
  readonly cargando = this.presupuestoService.cargando;
  readonly error = this.presupuestoService.error;
  readonly mes = this.presupuestoService.mes;
  readonly modoDemo = this.presupuestoService.modoDemo;

  /** Saldo inicial en edición. null mientras no se está editando. */
  readonly saldoEnEdicion = signal<number | null>(null);
  readonly guardandoSaldo = signal(false);

  /** Valores previstos en edición. Mapa lineaId -> valor. */
  readonly previstoEnEdicion = signal<Map<string, number>>(new Map());
  readonly guardandoPrevisto = signal<Set<string>>(new Set());

  readonly tituloMes = computed(() => nombreDelMes(this.mes()));
  readonly esMesActual = computed(() => this.mes() === mesActual());

  /** El resumen que se pinta: si la carga falló, se muestra el aviso y no datos viejos. */
  readonly datosVisibles = computed(() => (this.error() ? null : this.resumen()));

  readonly mostrarFormGasto = signal(false);
  readonly guardandoGasto = signal(false);

  // Campos del formulario como signals individuales (Angular no admite spread en templates)
  readonly formCategoriaId = signal('');
  readonly formNombre    = signal('');
  readonly formDesc      = signal('');
  readonly formMonto     = signal(0);
  readonly formDate      = signal('');

  readonly categoriaSeleccionada = signal<LineaResumen | null>(null);
  readonly transacciones = signal<Transaccion[]>([]);
  readonly cargandoTx = signal(false);

  readonly mostrarSettings = signal(false);
  readonly categoriaNueva = signal('');

  toggleSettings(): void {
    this.mostrarSettings.update(v => !v);
  }

  readonly categoriasParaAgregar = computed(() => {
    const idsEnUso = new Set(
      (this.resumen()?.gastos.lineas ?? []).map(l => l.categoriaId).filter(Boolean)
    );
    return this._categorias().filter(c => !idsEnUso.has(c.id));
  });

  readonly distribucionOpciones = [
    { label: 'Necesidades', value: 'necesidades' as TipoCategoria503020 },
    { label: 'Deseos',      value: 'deseos'      as TipoCategoria503020 },
    { label: 'Ahorro',      value: 'ahorro'      as TipoCategoria503020 },
  ];

  readonly transaccionesFiltradas = computed(() => {
    const cat = this.categoriaSeleccionada();
    if (!cat) return [];
    return this.transacciones().filter(t => t.categoriaId === cat.categoriaId);
  });

  setMonto(v: number | null): void {
    this.formMonto.set(v ?? 0);
  }

  private readonly _categorias = signal<Categoria[]>([]);

  readonly categoriasDiponibles = computed(() => this._categorias());

  /** Alto de las barras de saldo, en % de la más alta. Mínimo visible del 8%. */
  readonly alturaBarras = computed(() => {
    const resumen = this.resumen();
    if (!resumen) return { inicial: 0, final: 0 };
    const maximo = Math.max(Math.abs(resumen.saldoInicial), Math.abs(resumen.saldoFinal));
    if (maximo === 0) return { inicial: 8, final: 8 };
    return {
      inicial: Math.max(8, (Math.abs(resumen.saldoInicial) / maximo) * 100),
      final: Math.max(8, (Math.abs(resumen.saldoFinal) / maximo) * 100)
    };
  });

  ngOnInit(): void {
    this.presupuestoService.cargarResumen();
    this.categoriaService.getCategoria().subscribe(cats => {
      this._categorias.set(cats);
      const intentar = () => {
        if (this.resumen()) {
          this.vincularLineasSinCategoria(cats);
        } else {
          setTimeout(intentar, 200);
        }
      };
      intentar();
    });
  }

  /** Vincula las lineas sin categoriaId en paralelo y recarga una sola vez al final. */
  private vincularLineasSinCategoria(cats: Categoria[]): void {
    const lineas = this.resumen()?.gastos.lineas ?? [];
    const mapaCategoria = new Map(cats.map(c => [c.nombre.toLowerCase(), c.id]));
    const peticiones = lineas
      .filter(l => l.lineaId && !l.categoriaId)
      .map(l => ({ lineaId: l.lineaId!, catId: mapaCategoria.get(l.nombre.toLowerCase()) }))
      .filter(x => x.catId)
      .map(x => this.presupuestoService.vincularCategoria(x.lineaId, x.catId!));

    if (!peticiones.length) return;
    forkJoin(peticiones).subscribe({ next: () => this.presupuestoService.recargar(), error: () => {} });
  }

  cambiarMes(meses: number): void {
    this.saldoEnEdicion.set(null);
    this.previstoEnEdicion.set(new Map());
    this.presupuestoService.cargarResumen(desplazarMes(this.mes(), meses));
  }

  irAlMesActual(): void {
    this.saldoEnEdicion.set(null);
    this.previstoEnEdicion.set(new Map());
    this.presupuestoService.cargarResumen(mesActual());
  }

  editarSaldo(): void {
    this.saldoEnEdicion.set(this.resumen()?.saldoInicial ?? 0);
  }

  cancelarEdicionSaldo(): void {
    this.saldoEnEdicion.set(null);
  }

  guardarSaldo(): void {
    const resumen = this.resumen();
    const valor = this.saldoEnEdicion();
    if (!resumen || valor === null) return;

    this.guardandoSaldo.set(true);
    this.presupuestoService.guardarSaldoInicial(resumen.presupuestoId, valor).subscribe({
      next: () => {
        this.saldoEnEdicion.set(null);
        this.guardandoSaldo.set(false);
      },
      error: () => this.guardandoSaldo.set(false)
    });
  }

  /** Ancho de la barra Previsto/Real, en % de la mayor de las dos. */
  anchoBarra(valor: number, bloque: BloqueResumen): number {
    const maximo = Math.max(bloque.previstoTotal, bloque.realTotal);
    return maximo === 0 ? 0 : (valor / maximo) * 100;
  }

  /** Actualiza el valor previsto en edición para una línea. */
  actualizarPrevisto(lineaId: string | null, valor: number | null): void {
    if (!lineaId) return;
    
    const mapa = new Map(this.previstoEnEdicion());
    if (valor === null) {
      mapa.delete(lineaId);
    } else {
      mapa.set(lineaId, valor);
    }
    this.previstoEnEdicion.set(mapa);
  }

  /** Obtiene el valor previsto en edición o el valor original. */
  obtenerPrevisto(linea: any): number {
    if (linea.lineaId) {
      return this.previstoEnEdicion().get(linea.lineaId) ?? linea.previsto;
    }
    return linea.previsto;
  }

  /** Verifica si una línea está en edición. */
  estaEditando(lineaId: string | null): boolean {
    return lineaId ? this.previstoEnEdicion().has(lineaId) : false;
  }

  /** Verifica si se está guardando una línea específica. */
  estaGuardando(lineaId: string | null): boolean {
    return lineaId ? this.guardandoPrevisto().has(lineaId) : false;
  }

  /** Cancela la edición de una línea. */
  cancelarEdicionPrevisto(lineaId: string | null): void {
    if (!lineaId) return;
    const mapa = new Map(this.previstoEnEdicion());
    mapa.delete(lineaId);
    this.previstoEnEdicion.set(mapa);
  }

  lineasConPresupuesto(lineas: LineaResumen[]): LineaResumen[] {
    return lineas.filter(l => l.presupuestada);
  }

  cambiarDistribucion(linea: LineaResumen, tipo: TipoCategoria503020): void {
    if (!linea.categoriaId) return;
    this.categoriaService.updateCategoria(linea.categoriaId, { tipo503020: tipo })
      .subscribe({ next: () => this.presupuestoService.recargar(), error: () => {} });
  }

  quitarCategoria(lineaId: string): void {
    this.presupuestoService.borrarLinea(lineaId)
      .subscribe({ next: () => this.presupuestoService.recargar(), error: () => {} });
  }

  agregarCategoria(): void {
    const catId = this.categoriaNueva();
    const resumen = this.resumen();
    if (!catId || !resumen) return;
    const cat = this._categorias().find(c => c.id === catId);
    if (!cat) return;
    this.presupuestoService.crearLinea(resumen.presupuestoId, 'gasto', cat.nombre)
      .subscribe({
        next: (linea) => {
          this.categoriaNueva.set('');
          this.presupuestoService.vincularCategoria(linea.id, catId)
            .subscribe({ next: () => this.presupuestoService.recargar(), error: () => {} });
        },
        error: () => {}
      });
  }

  seleccionarCategoria(linea: LineaResumen): void {
    if (this.categoriaSeleccionada()?.lineaId === linea.lineaId) {
      this.categoriaSeleccionada.set(null);
      return;
    }
    this.categoriaSeleccionada.set(linea);
    this.cargandoTx.set(true);
    this.presupuestoService.getTransacciones().subscribe({
      next: txs => {
        console.log('Transacciones recibidas:', txs);
        this.transacciones.set(txs.filter(t => t.tipo === 'gasto'));
        this.cargandoTx.set(false);
      },
      error: () => this.cargandoTx.set(false)
    });
  }

  abrirFormGasto(): void {
    this.formCategoriaId.set('');
    this.formNombre.set('');
    this.formDesc.set('');
    this.formMonto.set(0);
    this.formDate.set(new Date().toISOString().split('T')[0]);
    this.mostrarFormGasto.set(true);
  }

  cancelarGasto(): void {
    this.mostrarFormGasto.set(false);
  }

  guardarGasto(): void {
    const categoriaId = this.formCategoriaId();
    const name        = this.formNombre();
    const descripcion = this.formDesc();
    const monto       = this.formMonto();
    const date        = this.formDate();
    if (!categoriaId || !name || !(monto > 0) || !date) return;

    this.guardandoGasto.set(true);
    this.presupuestoService.crearTransaccion('gasto', {
      categoriaId, date, descripcion, monto, name
    }).subscribe({
      next: () => {
        this.mostrarFormGasto.set(false);
        this.guardandoGasto.set(false);
        this.presupuestoService.recargar();
      },
      error: () => this.guardandoGasto.set(false)
    });
  }

  readonly gastoEditandoId  = signal<string | null>(null);
  readonly editNombre       = signal('');
  readonly editFecha        = signal('');
  readonly editDescripcion  = signal('');
  readonly editMonto        = signal(0);
  readonly editCategoriaId  = signal('');
  readonly guardandoEdicion = signal(false);

  editarGasto(tx: Transaccion): void {
    this.gastoEditandoId.set(tx.id);
    this.editFecha.set(tx.date);
    this.editNombre.set(tx.name);
    this.editDescripcion.set(tx.descripcion);
    this.editMonto.set(tx.monto);
    this.editCategoriaId.set(tx.categoriaId ?? '');
  }

  cancelarEdicionGasto(): void {
    this.gastoEditandoId.set(null);
  }

  guardarEdicionGasto(tx: Transaccion): void {
    this.guardandoEdicion.set(true);
    const cat = this._categorias().find(c => c.id === this.editCategoriaId());
    this.gastosService.updateData(tx.id, {
      date:        this.editFecha(),
      descripcion: this.editDescripcion(),
      monto:       this.editMonto(),
      categoriaId: this.editCategoriaId() || undefined,
      name:       this.editNombre(),
      categoria:   cat?.nombre ?? tx.categoria
    }).subscribe({
      next: (updated) => {
        this.transacciones.update(txs => txs.map(t => t.id === tx.id
          ? { ...t, date: updated.date, descripcion: updated.descripcion, monto: updated.monto,
              name: updated.name,
              categoriaId: updated.categoriaId ?? null, categoria: cat?.nombre ?? t.categoria }
          : t
        ));
        this.gastoEditandoId.set(null);
        this.guardandoEdicion.set(false);
        this.presupuestoService.recargar();
      },
      error: () => this.guardandoEdicion.set(false)
    });
  }

  /** Guarda el valor previsto de una línea. */
  guardarPrevisto(lineaId: string | null): void {
    if (!lineaId) return;
    
    const valor = this.previstoEnEdicion().get(lineaId);
    if (valor === undefined) return;

    const guardando = new Set(this.guardandoPrevisto());
    guardando.add(lineaId);
    this.guardandoPrevisto.set(guardando);

    this.presupuestoService.guardarPrevisto(lineaId, valor).subscribe({
      next: () => {
        // Remover de edición
        const mapa = new Map(this.previstoEnEdicion());
        mapa.delete(lineaId);
        this.previstoEnEdicion.set(mapa);
        
        // Remover de guardando
        const guardando = new Set(this.guardandoPrevisto());
        guardando.delete(lineaId);
        this.guardandoPrevisto.set(guardando);
        
        // Recargar el resumen
        this.presupuestoService.cargarResumen(this.mes());
      },
      error: () => {
        const guardando = new Set(this.guardandoPrevisto());
        guardando.delete(lineaId);
        this.guardandoPrevisto.set(guardando);
      }
    });
  }
}
