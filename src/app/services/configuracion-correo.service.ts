import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Qué signo fuerza un asunto. 'auto' deja decidir al parser del correo. */
export type TipoAsunto = 'gasto' | 'ingreso' | 'auto';

export interface AsuntoCorreo {
  id: string;
  asunto: string;
  descripcion?: string | null;
  tipo: TipoAsunto;
  activo: boolean;
  userId?: string | null;
}

export interface RemitenteCorreo {
  id: string;
  remitente: string;
  descripcion?: string | null;
  activo: boolean;
  userId?: string | null;
}

/**
 * Configuración de la importación desde correo: qué asuntos se buscan en el
 * buzón y de qué remitentes.
 *
 * Vive en el backend (`/api/asuntos-correo` y `/api/remitentes-correo`), que es
 * quien la aplica: si la petición de importación no manda asuntos ni remitente,
 * usa los activos de estas tablas. Por eso el importador no necesita pasarlos.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracionCorreoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private urlAsuntos = `${environment.apiUrl}/asuntos-correo`;
  private urlRemitentes = `${environment.apiUrl}/remitentes-correo`;

  readonly asuntos = signal<AsuntoCorreo[]>([]);
  readonly remitentes = signal<RemitenteCorreo[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  private get userId(): string | null {
    return this.authService.user()?.uid ?? null;
  }

  /** Recarga ambas listas. Trae también las compartidas (userId nulo). */
  async cargar(): Promise<void> {
    const userId = this.userId;
    if (!userId) return;

    this.cargando.set(true);
    this.error.set(null);
    try {
      const [asuntos, remitentes] = await Promise.all([
        firstValueFrom(this.http.get<AsuntoCorreo[]>(this.urlAsuntos, { params: { userId } })),
        firstValueFrom(this.http.get<RemitenteCorreo[]>(this.urlRemitentes, { params: { userId } }))
      ]);
      this.asuntos.set(asuntos ?? []);
      this.remitentes.set(remitentes ?? []);
    } catch (e) {
      this.error.set(this.mensajeDe(e, 'No se pudo cargar la configuración de correo.'));
    } finally {
      this.cargando.set(false);
    }
  }

  async crearAsunto(asunto: string, tipo: TipoAsunto): Promise<boolean> {
    const userId = this.userId;
    if (!userId || !asunto.trim()) return false;
    return this.conGuardado(
      () => firstValueFrom(this.http.post<AsuntoCorreo>(this.urlAsuntos, {
        asunto: asunto.trim(), tipo, activo: true, userId
      })),
      'No se pudo dar de alta el asunto.'
    );
  }

  async actualizarAsunto(id: string, cambios: Partial<Pick<AsuntoCorreo, 'asunto' | 'tipo' | 'activo'>>): Promise<boolean> {
    return this.conGuardado(
      () => firstValueFrom(this.http.put<AsuntoCorreo>(`${this.urlAsuntos}/${id}`, cambios)),
      'No se pudo actualizar el asunto.'
    );
  }

  async borrarAsunto(id: string): Promise<boolean> {
    return this.conGuardado(
      () => firstValueFrom(this.http.delete(`${this.urlAsuntos}/${id}`)),
      'No se pudo borrar el asunto.'
    );
  }

  async crearRemitente(remitente: string): Promise<boolean> {
    const userId = this.userId;
    if (!userId || !remitente.trim()) return false;
    return this.conGuardado(
      () => firstValueFrom(this.http.post<RemitenteCorreo>(this.urlRemitentes, {
        remitente: remitente.trim(), activo: true, userId
      })),
      'No se pudo dar de alta el remitente.'
    );
  }

  async actualizarRemitente(id: string, cambios: Partial<Pick<RemitenteCorreo, 'remitente' | 'activo'>>): Promise<boolean> {
    return this.conGuardado(
      () => firstValueFrom(this.http.put<RemitenteCorreo>(`${this.urlRemitentes}/${id}`, cambios)),
      'No se pudo actualizar el remitente.'
    );
  }

  async borrarRemitente(id: string): Promise<boolean> {
    return this.conGuardado(
      () => firstValueFrom(this.http.delete(`${this.urlRemitentes}/${id}`)),
      'No se pudo borrar el remitente.'
    );
  }

  /** Ejecuta la escritura y recarga, para que la lista refleje lo que hay en el servidor. */
  private async conGuardado(operacion: () => Promise<unknown>, mensajeError: string): Promise<boolean> {
    this.guardando.set(true);
    this.error.set(null);
    try {
      await operacion();
      await this.cargar();
      return true;
    } catch (e) {
      this.error.set(this.mensajeDe(e, mensajeError));
      return false;
    } finally {
      this.guardando.set(false);
    }
  }

  /** El backend responde 409 con su propio texto cuando algo está repetido. */
  private mensajeDe(e: unknown, porDefecto: string): string {
    const err = e as { error?: { error?: string } };
    return err?.error?.error ?? porDefecto;
  }
}
