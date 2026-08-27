import {
  ChangeDetectionStrategy, Component, computed, inject, signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button' ;
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Categoria } from '../../interface/categoria';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaIngreso, CategoriaIngresoService } from '../../services/categoria-ingreso.service';
import { FilaExcel } from '../../services/openai.service';
import { GastosService } from '../../services/gastos.service';
import { AuthService } from '../../services/auth.service';
import { PresupuestoService } from '../../services/presupuesto.service';

// FilaExcel extendida con tipo y montoRaw para detectar gasto/ingreso por signo
interface FilaImport extends FilaExcel {
  tipo: 'gasto' | 'ingreso';
}

type Paso = 'idle' | 'mapeo' | 'clasificando' | 'revision' | 'importando';

interface MapaCampos {
  fecha: string;
  descripcion: string;
  monto: string;
}

@Component({
  selector: 'app-importar-excel',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, TableModule],
  templateUrl: './importar-excel.component.html',
  styleUrl: './importar-excel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportarExcelComponent implements OnInit {
  private categoriaService        = inject(CategoriaService);
  private categoriaIngresoService = inject(CategoriaIngresoService);
  private gastosService           = inject(GastosService);
  private authService             = inject(AuthService);
  private presupuestoService      = inject(PresupuestoService);

  readonly paso              = signal<Paso>('idle');
  readonly categorias        = signal<Categoria[]>([]);
  readonly categoriasIngreso = signal<CategoriaIngreso[]>([]);
  readonly headers           = signal<string[]>([]);
  readonly filasMuestra      = signal<Record<string, unknown>[]>([]);
  readonly filasRaw          = signal<Record<string, unknown>[]>([]);
  readonly filas             = signal<FilaImport[]>([]);
  readonly importando        = signal(false);
  readonly importados        = signal(0);
  readonly importadosFallados = signal(0);

  mapa: MapaCampos = { fecha: '', descripcion: '', monto: '' };

  readonly opcionesCampo = computed(() => [
    { label: '— Ignorar —', value: '' },
    ...this.headers().map(h => ({ label: h, value: h }))
  ]);

  readonly opcionesCategoria = computed(() =>
    this.categorias().map(c => ({ label: c.nombre, value: c.id }))
  );

  readonly opcionesCategoriaIngreso = computed(() =>
    this.categoriasIngreso().map(c => ({ label: c.nombre, value: c.id }))
  );

  opcionesParaFila(fila: FilaImport) {
    return fila.tipo === 'ingreso' ? this.opcionesCategoriaIngreso() : this.opcionesCategoria();
  }

  readonly puedeMapear = computed(() =>
    !!this.mapa.fecha && !!this.mapa.descripcion && !!this.mapa.monto
  );

  ngOnInit(): void {
    this.categoriaService.getCategoria().subscribe(cats => this.categorias.set(cats));
    this.categoriaIngresoService.getCategorias().subscribe(cats => this.categoriasIngreso.set(cats));
  }

  /** Abre el selector de archivo */
  seleccionarArchivo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.leerArchivo(file);
    };
    input.click();
  }

  private leerArchivo(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: ''
      });

      if (!rows.length) return;
      this.headers.set(Object.keys(rows[0]));
      this.filasMuestra.set(rows.slice(0, 3));
      this.autodetectarCampos(Object.keys(rows[0]));
      this.filasRaw.set(rows);
      this.paso.set('mapeo');
    };
    reader.readAsArrayBuffer(file);
  }

  private autodetectarCampos(headers: string[]): void {
    const lower = headers.map(h => h.toLowerCase());
    this.mapa.fecha       = headers[lower.findIndex(h => h.includes('fech') || h.includes('date'))] ?? '';
    this.mapa.descripcion = headers[lower.findIndex(h => h.includes('desc') || h.includes('concepto') || h.includes('nombre'))] ?? '';
    this.mapa.monto       = headers[lower.findIndex(h => h.includes('mont') || h.includes('importe') || h.includes('amount') || h.includes('valor'))] ?? '';
  }

  /** Convierte DD/MM/YYYY o DD-MM-YYYY a YYYY-MM-DD; deja pasar los que ya son ISO */
  private normalizarFecha(valor: string): string {
    const ddmmyyyy = valor.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2,'0')}-${ddmmyyyy[1].padStart(2,'0')}`;
    return valor;
  }
  /** Parsea importes en formato español (1.657,28) o inglés (1,657.28). */
  private parseMonto(valor: string): number {
    const limpio = valor.replace(/\s/g, '').replace(/[€$]/g, '');
    const tieneComa = limpio.includes(',');
    const tienePunto = limpio.includes('.');

    // Español: 1.657,28 o 1657,28
    if (tieneComa && (!tienePunto || limpio.lastIndexOf(',') > limpio.lastIndexOf('.'))) {
      return parseFloat(limpio.replace(/\./g, '').replace(',', '.')) || 0;
    }

    // Inglés: 1,657.28
    if (tienePunto && tieneComa) {
      return parseFloat(limpio.replace(/,/g, '')) || 0;
    }

    return parseFloat(limpio) || 0;
  }
  /** Backend: reglas → OpenAI fallback → revisión (sin crear gastos) */
  clasificar(): void {
    const raw = this.filasRaw();
    // Signo del monto raw determina si es ingreso (positivo) o gasto (negativo/absoluto)
    const filasNormalizadas: FilaImport[] = raw.map(row => {
      const montoRaw = this.parseMonto(String(row[this.mapa.monto] ?? '0'));
      return {
        descripcion: String(row[this.mapa.descripcion] ?? '').trim(),
        monto:       Math.abs(montoRaw),
        date:        this.normalizarFecha(String(row[this.mapa.fecha] ?? new Date().toISOString().split('T')[0])),
        tipo:        (montoRaw >= 0 ? 'ingreso' : 'gasto') as 'gasto' | 'ingreso'
      };
    }).filter(f => f.descripcion && f.monto > 0);

    this.filas.set(filasNormalizadas);
    this.paso.set('clasificando');

    const soloGastos = filasNormalizadas.filter(f => f.tipo === 'gasto');
    const soloIngresos = filasNormalizadas.filter(f => f.tipo === 'ingreso');

    if (!soloGastos.length && !soloIngresos.length) {
      this.paso.set('revision');
      return;
    }

    // Recargar categorías para incluir las creadas recientemente
    forkJoin({
      gastos: this.categoriaService.getCategoria().pipe(catchError(() => of([]))),
      ingresos: this.categoriaIngresoService.getCategorias().pipe(catchError(() => of([])))
    }).subscribe(({ gastos, ingresos }) => {
      this.categorias.set(gastos);
      this.categoriasIngreso.set(ingresos);

      const peticionesGastos = soloGastos.map(f =>
        this.gastosService.clasificarGasto(f.descripcion, f.monto).pipe(
          catchError(() => of({ categoriaClasificada: '', categoriaId: null }))
        )
      );

      const peticionesIngresos = soloIngresos.map(f =>
        this.categoriaIngresoService.clasificarIngreso(f.descripcion, f.monto).pipe(
          catchError(() => of({ categoriaClasificada: '', categoriaId: null }))
        )
      );

      forkJoin([...peticionesGastos, ...peticionesIngresos]).subscribe(resultados => {
        const cats = this.categorias();
        const catsIngreso = this.categoriasIngreso();
        let gastoIdx = 0;
        let ingresoIdx = 0;
        const clasificadas = filasNormalizadas.map(f => {
          if (f.tipo === 'gasto') {
            const { categoriaClasificada, categoriaId } = resultados[peticionesGastos.length ? gastoIdx++ : 0];
            const catId = categoriaId ?? cats.find(c =>
              c.nombre.toLowerCase() === (categoriaClasificada ?? '').toLowerCase()
            )?.id;
            return { ...f, categoriaId: catId, categoriaNombre: categoriaClasificada };
          }
          const { categoriaClasificada, categoriaId } = resultados[peticionesIngresos.length ? soloGastos.length + ingresoIdx++ : 0];
          const catId = categoriaId ?? catsIngreso.find(c =>
            c.nombre.toLowerCase() === (categoriaClasificada ?? '').toLowerCase()
          )?.id;
          return { ...f, categoriaId: catId, categoriaNombre: categoriaClasificada };
        });
        this.filas.set(clasificadas);
        this.paso.set('revision');
      });
    });
  }

  actualizarCategoria(index: number, categoriaId: string): void {
    const arr = [...this.filas()];
    const fila = arr[index];
    const cats = fila.tipo === 'ingreso' ? this.categoriasIngreso() : this.categorias();
    const cat  = cats.find(c => c.id === categoriaId);
    arr[index] = { ...fila, categoriaId, categoriaNombre: cat?.nombre ?? '' };
    this.filas.set(arr);
  }

  toggleTipo(index: number): void {
    const arr  = [...this.filas()];
    arr[index] = { ...arr[index], tipo: arr[index].tipo === 'gasto' ? 'ingreso' : 'gasto', categoriaId: undefined, categoriaNombre: '' };
    this.filas.set(arr);
  }

  /** Crea gastos e ingresos con la categoría confirmada por el usuario */
  importar(): void {
    if (!this.authService.user()?.uid) return;

    this.importando.set(true);
    this.importados.set(0);
    this.importadosFallados.set(0);
    this.paso.set('importando');

    const filas = this.filas().filter(f => !!f.categoriaId);
    const omitidos = this.filas().length - filas.length;

    if (!filas.length) {
      this.importadosFallados.set(omitidos);
      this.importando.set(false);
      return;
    }

    const peticiones = filas.map(f =>
      this.presupuestoService.crearTransaccion(f.tipo, {
        descripcion: f.descripcion,
        monto:       f.monto,
        date:        f.date,
        name:        f.descripcion,
        categoriaId: f.categoriaId!
      }).pipe(catchError(() => of(null)))
    );

    forkJoin(peticiones).subscribe(resultados => {
      const exitos = resultados.filter(r => r !== null).length;
      this.importados.set(exitos);
      this.importadosFallados.set(filas.length - exitos + omitidos);
      this.importando.set(false);
      this.presupuestoService.recargar();
      this.paso.set('idle');
      this.filas.set([]);
      this.filasRaw.set([]);
      this.headers.set([]);
    });
  }

  cancelar(): void {
    this.paso.set('idle');
    this.filas.set([]);
    this.filasRaw.set([]);
    this.headers.set([]);
  }
}
