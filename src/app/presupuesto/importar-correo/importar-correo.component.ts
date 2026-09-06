import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../services/auth.service';
import { ImapService, MovimientoCorreo } from '../../services/imap.service';
import { PresupuestoService } from '../../services/presupuesto.service';

type Paso = 'idle' | 'buscando' | 'revision' | 'importando' | 'resultado';

/**
 * Importa movimientos desde los correos del banco.
 *
 * Son dos llamadas al mismo endpoint: la primera con `dryRun` para enseñar lo
 * encontrado sin tocar nada, y la segunda —solo si el usuario confirma— sin
 * `dryRun`, que es la que crea los movimientos y marca los correos como leídos.
 */
@Component({
  selector: 'app-importar-correo',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './importar-correo.component.html',
  styleUrl: './importar-correo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportarCorreoComponent {
  private imapService = inject(ImapService);
  private authService = inject(AuthService);
  private presupuestoService = inject(PresupuestoService);

  readonly paso = signal<Paso>('idle');
  readonly error = signal<string | null>(null);
  readonly encontrados = signal<MovimientoCorreo[]>([]);
  readonly asuntosUsados = signal<string[]>([]);
  readonly importados = signal(0);

  /** Los que traen datos aprovechables; el resto se cuenta pero no se importa. */
  readonly aprovechables = computed(() =>
    this.encontrados().filter((m) => m.estado !== 'sin_datos' && m.monto !== undefined)
  );
  readonly ilegibles = computed(() =>
    this.encontrados().filter((m) => m.estado === 'sin_datos')
  );

  readonly totalGastos = computed(() =>
    this.aprovechables().filter((m) => m.tipo === 'gasto').reduce((s, m) => s + (m.monto ?? 0), 0)
  );
  readonly totalIngresos = computed(() =>
    this.aprovechables().filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + (m.monto ?? 0), 0)
  );

  /** Paso 1: busca y clasifica sin crear nada. */
  buscar(): void {
    const userId = this.authService.user()?.uid;
    if (!userId) {
      this.error.set('Necesitas iniciar sesión para importar desde el correo.');
      return;
    }

    this.paso.set('buscando');
    this.error.set(null);
    this.encontrados.set([]);

    this.imapService.procesarCorreos(userId, true).subscribe({
      next: (respuesta) => {
        this.encontrados.set(respuesta.resultados ?? []);
        this.asuntosUsados.set(respuesta.asuntos ?? []);
        this.paso.set('revision');
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo leer el buzón de correo.');
        this.paso.set('idle');
      }
    });
  }

  /** Paso 2: repite la búsqueda creando los movimientos de verdad. */
  importar(): void {
    const userId = this.authService.user()?.uid;
    if (!userId) return;

    this.paso.set('importando');
    this.error.set(null);

    this.imapService.procesarCorreos(userId, false).subscribe({
      next: (respuesta) => {
        const insertados = (respuesta.resultados ?? []).filter((m) => m.estado === 'insertado');
        this.importados.set(insertados.length);
        this.paso.set('resultado');
        this.presupuestoService.recargar();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudieron importar los movimientos.');
        this.paso.set('revision');
      }
    });
  }

  cancelar(): void {
    this.encontrados.set([]);
    this.error.set(null);
    this.paso.set('idle');
  }
}
