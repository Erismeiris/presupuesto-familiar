import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Un movimiento encontrado en un correo, tal como lo devuelve el backend. */
export interface MovimientoCorreo {
  uid: number;
  /** 'simulado' en la revisión, 'insertado' al importar, 'sin_datos' si no se pudo leer. */
  estado: 'simulado' | 'insertado' | 'sin_datos';
  subject?: string;
  tipo?: 'gasto' | 'ingreso';
  monto?: number;
  descripcion?: string;
  fecha?: string;
  tarjeta?: string | null;
  /** Categoría propuesta por el clasificador del backend. */
  categoria?: string;
}

export interface RespuestaCorreos {
  success: boolean;
  /** Asuntos que se han buscado (útil para saber si se usó el de por defecto). */
  asuntos?: string[];
  procesados: number;
  resultados: MovimientoCorreo[];
}

@Injectable({ providedIn: 'root' })
export class ImapService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/imap`;

  /**
   * Busca correos de pago y devuelve los movimientos que contienen.
   *
   * No se manda ni asunto ni remitente a propósito: al no llegar ninguno, el
   * backend usa los que el usuario tenga activos en su configuración de correo,
   * que es la misma que aplica el sync automático. La respuesta trae en
   * `asuntos` los que finalmente se han buscado.
   *
   * Con `dryRun` en true extrae y clasifica pero **no** crea nada ni marca los
   * correos como leídos, de modo que se puede revisar antes. Con false vuelve a
   * leer el buzón, crea los movimientos y marca los correos.
   */
  procesarCorreos(userId: string, dryRun: boolean): Observable<RespuestaCorreos> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('dryRun', String(dryRun));

    return this.http.post<RespuestaCorreos>(
      `${this.baseUrl}/process-payments`, {}, { params, withCredentials: true }
    );
  }
}
