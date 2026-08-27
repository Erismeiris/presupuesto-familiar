import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../interface/categoria';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private get userId(): string | null {
    return this.authService.user()?.uid ?? this.authService.getCurrentUser()?.uid ?? null;
  }

  getCategoria(): Observable<Categoria[]> {
    const params: Record<string, string> = {};
    const userId = this.userId;
    if (userId) params['userId'] = userId;
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`, { params });
  }

updateCategoria(id: string, data: Partial<Categoria>): Observable<Categoria> {
  return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, data);
}

crearCategoria(data: Partial<Categoria>): Observable<Categoria> {
  return this.http.post<Categoria>(`${this.baseUrl}/categorias`, data);
}

}
