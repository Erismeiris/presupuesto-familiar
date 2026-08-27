import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CategoriaIngreso {
  id: string;
  nombre: string;
  descripcion?: string;
  public?: boolean;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriaIngresoService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private get userId(): string | null {
    return this.authService.user()?.uid ?? this.authService.getCurrentUser()?.uid ?? null;
  }

  getCategorias(): Observable<CategoriaIngreso[]> {
    const params: Record<string, string> = {};
    const userId = this.userId;
    if (userId) params['userId'] = userId;
    return this.http.get<CategoriaIngreso[]>(`${this.baseUrl}/categoriaingresos`, { params });
  }

  clasificarIngreso(descripcion: string, cantidad: number): Observable<{ categoriaClasificada: string; categoriaId: string | null }> {
    return this.http.post<{ categoriaClasificada: string; categoriaId: string | null }>(`${this.baseUrl}/ingresos/clasificar`, { descripcion, cantidad });
  }

  crearCategoria(data: Partial<CategoriaIngreso>): Observable<CategoriaIngreso> {
    return this.http.post<CategoriaIngreso>(`${this.baseUrl}/categoriaingresos`, data);
  }

  updateIngreso(id: string, data: Partial<CategoriaIngreso> & { date?: string; descripcion?: string; monto?: number; categoriaId?: string; name?: string; categoria?: string }): Observable<CategoriaIngreso> {
    return this.http.put<CategoriaIngreso>(`${this.baseUrl}/ingresos/${id}`, data);
  }
}
