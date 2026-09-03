import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import {
  ConfiguracionCorreoService,
  TipoAsunto
} from '../../services/configuracion-correo.service';

/**
 * Engranaje junto a «Importar desde correo»: da de alta los asuntos que se
 * buscan en el buzón y los remitentes por los que filtrar.
 *
 * Se guarda en el backend, que es quien lo aplica cuando la importación no
 * manda asuntos ni remitente en la petición.
 */
@Component({
  selector: 'app-config-correo',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule, TooltipModule],
  templateUrl: './config-correo.component.html',
  styleUrl: './config-correo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigCorreoComponent {
  private config = inject(ConfiguracionCorreoService);

  readonly asuntos = this.config.asuntos;
  readonly remitentes = this.config.remitentes;
  readonly cargando = this.config.cargando;
  readonly guardando = this.config.guardando;
  readonly error = this.config.error;

  readonly abierto = signal(false);

  readonly nuevoAsunto = signal('');
  readonly nuevoTipo = signal<TipoAsunto>('auto');
  readonly nuevoRemitente = signal('');

  /**
   * 'auto' deja que el parser decida el signo; los otros dos lo fuerzan, que es
   * lo que hace falta cuando el banco usa el mismo formato para cobros y abonos.
   */
  readonly opcionesTipo = [
    { label: 'Automático', value: 'auto' as TipoAsunto },
    { label: 'Siempre gasto', value: 'gasto' as TipoAsunto },
    { label: 'Siempre ingreso', value: 'ingreso' as TipoAsunto }
  ];

  alternar(): void {
    const abriendo = !this.abierto();
    this.abierto.set(abriendo);
    if (abriendo) void this.config.cargar();
  }

  async agregarAsunto(): Promise<void> {
    if (!this.nuevoAsunto().trim()) return;
    if (await this.config.crearAsunto(this.nuevoAsunto(), this.nuevoTipo())) {
      this.nuevoAsunto.set('');
      this.nuevoTipo.set('auto');
    }
  }

  cambiarTipo(id: string, tipo: TipoAsunto): void {
    void this.config.actualizarAsunto(id, { tipo });
  }

  alternarAsunto(id: string, activo: boolean): void {
    void this.config.actualizarAsunto(id, { activo: !activo });
  }

  borrarAsunto(id: string): void {
    void this.config.borrarAsunto(id);
  }

  async agregarRemitente(): Promise<void> {
    if (!this.nuevoRemitente().trim()) return;
    if (await this.config.crearRemitente(this.nuevoRemitente())) this.nuevoRemitente.set('');
  }

  alternarRemitente(id: string, activo: boolean): void {
    void this.config.actualizarRemitente(id, { activo: !activo });
  }

  borrarRemitente(id: string): void {
    void this.config.borrarRemitente(id);
  }
}
