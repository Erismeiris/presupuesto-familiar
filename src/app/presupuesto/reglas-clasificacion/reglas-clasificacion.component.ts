import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

import { Categoria } from '../../interface/categoria';
import { Regla } from '../../interface/regla.interface';
import { CategoriaIngreso, CategoriaIngresoService } from '../../services/categoria-ingreso.service';
import { CategoriaService } from '../../services/categoria.service';
import { ReglaService, TipoRegla } from '../../services/regla.service';

@Component({
  selector: 'app-reglas-clasificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule],
  templateUrl: './reglas-clasificacion.component.html',
  styleUrl: './reglas-clasificacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReglasClasificacionComponent {
  private reglasService = inject(ReglaService);
  private categoriasService = inject(CategoriaService);
  private categoriasIngresoService = inject(CategoriaIngresoService);

  readonly abierto = signal(false);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly guardandoId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly reglas = signal<Regla[]>([]);
  readonly categoriasGasto = signal<Categoria[]>([]);
  readonly categoriasIngreso = signal<CategoriaIngreso[]>([]);

  readonly tipoNuevo = signal<TipoRegla>('gasto');
  readonly patronNuevo = signal('');
  readonly categoriaNueva = signal('');
  readonly categoriasNuevas = computed(() =>
    this.tipoNuevo() === 'gasto' ? this.categoriasGasto() : this.categoriasIngreso()
  );

  readonly opcionesTipo = [
    { label: 'Gasto', value: 'gasto' as TipoRegla },
    { label: 'Ingreso', value: 'ingreso' as TipoRegla }
  ];

  alternar(): void {
    const abrir = !this.abierto();
    this.abierto.set(abrir);
    if (abrir && !this.reglas().length) void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { reglas, categoriasGasto, categoriasIngreso } = await firstValueFrom(forkJoin({
        reglas: this.reglasService.getReglas(),
        categoriasGasto: this.categoriasService.getCategoria(),
        categoriasIngreso: this.categoriasIngresoService.getCategorias()
      }));
      this.reglas.set(reglas);
      this.categoriasGasto.set(categoriasGasto);
      this.categoriasIngreso.set(categoriasIngreso);
      if (!this.categoriaNueva()) this.categoriaNueva.set(this.categoriasNuevas()[0]?.nombre ?? '');
    } catch (error) {
      this.error.set(this.mensajeDe(error, 'No se pudieron cargar las reglas de clasificación.'));
    } finally {
      this.cargando.set(false);
    }
  }

  cambiarTipoNuevo(tipo: TipoRegla): void {
    this.tipoNuevo.set(tipo);
    this.categoriaNueva.set((tipo === 'gasto' ? this.categoriasGasto() : this.categoriasIngreso())[0]?.nombre ?? '');
  }

  cambiarTipo(regla: Regla, tipo: TipoRegla): void {
    const categoria = (tipo === 'gasto' ? this.categoriasGasto() : this.categoriasIngreso())[0]?.nombre ?? '';
    this.cambiarLocal(regla, { tipo, categoria });
  }

  cambiarLocal(regla: Regla, cambios: Partial<Regla>): void {
    this.reglas.update(lista => lista.map(actual =>
      actual.id === regla.id ? { ...actual, ...cambios } : actual
    ));
  }

  opcionesCategoria(tipo: TipoRegla): Array<{ label: string; value: string }> {
    const categorias = tipo === 'gasto' ? this.categoriasGasto() : this.categoriasIngreso();
    return categorias.map(categoria => ({ label: categoria.nombre, value: categoria.nombre }));
  }

  async crear(): Promise<void> {
    const patron = this.patronNuevo().trim();
    const categoria = this.categoriaNueva();
    if (!patron || !categoria) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.reglasService.createRegla({
        patron,
        categoria,
        tipo: this.tipoNuevo()
      }));
      this.patronNuevo.set('');
      await this.cargar();
    } catch (error) {
      this.error.set(this.mensajeDe(error, 'No se pudo guardar la regla.'));
    } finally {
      this.guardando.set(false);
    }
  }

  async guardar(regla: Regla): Promise<void> {
    if (!regla.id || !regla.patron.trim() || !regla.categoria) return;

    this.guardandoId.set(regla.id);
    this.error.set(null);
    try {
      const actualizada = await firstValueFrom(this.reglasService.actualizarRegla(regla.id, {
        patron: regla.patron.trim(),
        categoria: regla.categoria,
        tipo: regla.tipo,
        confirmada: true
      }));
      this.reglas.update(lista => lista.map(actual => actual.id === actualizada.id ? actualizada : actual));
    } catch (error) {
      this.error.set(this.mensajeDe(error, 'No se pudo actualizar la regla.'));
    } finally {
      this.guardandoId.set(null);
    }
  }

  async borrar(regla: Regla): Promise<void> {
    if (!regla.id) return;
    this.guardandoId.set(regla.id);
    this.error.set(null);
    try {
      await firstValueFrom(this.reglasService.borrarRegla(regla.id));
      this.reglas.update(lista => lista.filter(actual => actual.id !== regla.id));
    } catch (error) {
      this.error.set(this.mensajeDe(error, 'No se pudo eliminar la regla.'));
    } finally {
      this.guardandoId.set(null);
    }
  }

  private mensajeDe(error: unknown, porDefecto: string): string {
    const respuesta = error as { error?: { error?: string } };
    return respuesta?.error?.error ?? porDefecto;
  }
}
