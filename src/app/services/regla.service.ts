import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Regla } from '../interface/regla.interface';

export type TipoRegla = Regla['tipo'];

@Injectable({
  providedIn: 'root'
})
export class ReglaService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getReglas(tipo?: TipoRegla): Observable<Regla[]> {
    return this.http.get<Regla[]>(`${this.baseUrl}/reglas`, {
      params: tipo ? { tipo } : {}
    });
  }

  createRegla(regla: Pick<Regla, 'patron' | 'categoria' | 'tipo'>): Observable<Regla> {
    return this.http.post<Regla>(`${this.baseUrl}/reglas`, regla);
  }

  actualizarRegla(id: string, cambios: Partial<Regla>): Observable<Regla> {
    return this.http.put<Regla>(`${this.baseUrl}/reglas/${id}`, cambios);
  }

  borrarRegla(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/reglas/${id}`);
  }
}
