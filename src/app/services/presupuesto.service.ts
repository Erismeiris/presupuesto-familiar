import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { resumenDemo } from '../presupuesto/presupuesto-demo';
import {
  LineaPresupuesto,
  NuevaTransaccion,
  ResumenMensual,
  TipoMovimiento,
  Transaccion
} from '../interface/presupuesto.interface';

/** Mes actual en formato YYYY-MM. */
export const mesActual = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};

/** Desplaza un mes YYYY-MM el número de meses indicado. */
export const desplazarMes = (mes: string, meses: number): string => {
  const [anio, numeroMes] = mes.split('-').map(Number);
  const fecha = new Date(anio, numeroMes - 1 + meses, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
};

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/** "2026-08" -> "agosto de 2026" */
export const nombreDelMes = (mes: string): string => {
  const [anio, numeroMes] = mes.split('-').map(Number);
  return `${NOMBRES_MES[numeroMes - 1]} de ${anio}`;
};

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/presupuestos`;

  /** Mes que se está viendo. Lo comparten el resumen y las transacciones. */
  readonly mes = signal<string>(mesActual());

  readonly resumen = signal<ResumenMensual | null>(null);
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /** true cuando lo que se ve es el presupuesto de ejemplo y no una cuenta real. */
  readonly modoDemo = signal<boolean>(false);

  private get userId(): string | null {
    return this.authService.user()?.uid ?? this.authService.getCurrentUser()?.uid ?? null;
  }

  /** Refresca el resumen del mes que se está viendo. */
  recargar(): void {
    this.cargarResumen(this.mes());
  }

  /**
   * Carga el resumen del mes en la señal. El backend crea el mes si no existe.
   * Sin sesión se muestra el presupuesto de ejemplo: quien llega de nuevas ve
   * la pantalla funcionando en lugar de un aviso.
   */
  cargarResumen(mes: string = this.mes()): void {
    this.mes.set(mes);

    const userId = this.userId;
    if (!userId) {
      this.mostrarDemo(mes);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.http
      .get<ResumenMensual>(`${this.baseUrl}/resumen`, { params: { userId, mes } })
      .subscribe({
        next: (resumen) => {
          this.modoDemo.set(false);
          this.resumen.set(resumen);
          this.cargando.set(false);
        },
        error: (err) => {
          // 401/403 significa sesión expirada: el interceptor ya habrá
          // intentado renovar y redirigido al login si falló.
          this.error.set(err?.error?.error ?? 'No se pudo cargar el presupuesto.');
          this.cargando.set(false);
        }
      });
  }

  private mostrarDemo(mes: string): void {
    this.modoDemo.set(true);
    this.resumen.set(resumenDemo(mes));
    this.error.set(null);
    this.cargando.set(false);
  }

  getMeses(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/meses`, {
      params: { userId: this.userId ?? '' }
    });
  }

  getTransacciones(mes: string = this.mes()): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.baseUrl}/transacciones`, {
      params: { userId: this.userId ?? '', mes }
    });
  }

  /** Guarda el saldo inicial del mes y refresca el resumen con la respuesta. */
  guardarSaldoInicial(presupuestoId: string, saldoInicial: number): Observable<ResumenMensual> {
    if (this.modoDemo()) {
      return throwError(() => new Error('El presupuesto de ejemplo no se puede editar.'));
    }

    return this.http
      .put<ResumenMensual>(`${this.baseUrl}/${presupuestoId}`, { saldoInicial })
      .pipe(tap((resumen) => this.resumen.set(resumen)));
  }

  getLineas(presupuestoId: string): Observable<LineaPresupuesto[]> {
    return this.http.get<LineaPresupuesto[]>(`${this.baseUrl}/${presupuestoId}/lineas`);
  }

  guardarPrevisto(lineaId: string, previsto: number): Observable<LineaPresupuesto> {
    return this.http.put<LineaPresupuesto>(`${this.baseUrl}/lineas/${lineaId}`, { previsto });
  }

  vincularCategoria(lineaId: string, categoriaId: string): Observable<LineaPresupuesto> {
    return this.http.put<LineaPresupuesto>(`${this.baseUrl}/lineas/${lineaId}`, { categoriaId });
  }

  renombrarLinea(lineaId: string, nombre: string): Observable<LineaPresupuesto> {
    return this.http.put<LineaPresupuesto>(`${this.baseUrl}/lineas/${lineaId}`, { nombre });
  }

  crearLinea(
    presupuestoId: string,
    tipo: TipoMovimiento,
    nombre: string,
    previsto = 0
  ): Observable<LineaPresupuesto> {
    return this.http.post<LineaPresupuesto>(`${this.baseUrl}/${presupuestoId}/lineas`, {
      tipo,
      nombre,
      previsto
    });
  }

  borrarLinea(lineaId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/lineas/${lineaId}`);
  }

  /**
   * Crea un gasto o un ingreso según el tipo. El userId lo pone el servicio:
   * la pantalla solo aporta los datos que ha escrito la persona.
   */
  crearTransaccion(
    tipo: TipoMovimiento,
    movimiento: Omit<NuevaTransaccion, 'userId'>
  ): Observable<unknown> {
    const userId = this.userId;
    if (!userId) return throwError(() => new Error('No hay sesión activa.'));

    const ruta = tipo === 'gasto' ? 'gastos' : 'ingresos';
    return this.http.post(`${environment.apiUrl}/${ruta}`, { ...movimiento, userId });
  }

  borrarTransaccion(tipo: TipoMovimiento, id: string): Observable<unknown> {
    const ruta = tipo === 'gasto' ? 'gastos' : 'ingresos';
    return this.http.delete(`${environment.apiUrl}/${ruta}/${id}`);
  }
}
