import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CategoriaIngreso {
  id: string;
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriaIngresoService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<CategoriaIngreso[]> {
    return this.http.get<CategoriaIngreso[]>(`${this.baseUrl}/categoriaingresos`);
  }
}
