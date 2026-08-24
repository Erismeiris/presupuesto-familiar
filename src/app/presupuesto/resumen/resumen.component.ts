import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';

import { BloqueResumen } from '../../interface/presupuesto.interface';
import {
  desplazarMes,
  mesActual,
  nombreDelMes,
  PresupuestoService
} from '../../services/presupuesto.service';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputNumberModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenComponent implements OnInit {
  private presupuestoService = inject(PresupuestoService);

  readonly resumen = this.presupuestoService.resumen;
  readonly cargando = this.presupuestoService.cargando;
  readonly error = this.presupuestoService.error;
  readonly mes = this.presupuestoService.mes;
  readonly modoDemo = this.presupuestoService.modoDemo;

  /** Saldo inicial en edición. null mientras no se está editando. */
  readonly saldoEnEdicion = signal<number | null>(null);
  readonly guardandoSaldo = signal(false);

  readonly tituloMes = computed(() => nombreDelMes(this.mes()));
  readonly esMesActual = computed(() => this.mes() === mesActual());

  /** El resumen que se pinta: si la carga falló, se muestra el aviso y no datos viejos. */
  readonly datosVisibles = computed(() => (this.error() ? null : this.resumen()));

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
  }

  cambiarMes(meses: number): void {
    this.saldoEnEdicion.set(null);
    this.presupuestoService.cargarResumen(desplazarMes(this.mes(), meses));
  }

  irAlMesActual(): void {
    this.saldoEnEdicion.set(null);
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
}
