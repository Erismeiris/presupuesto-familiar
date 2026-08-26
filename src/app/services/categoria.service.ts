import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../interface/categoria';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private baseUrl = environment.apiUrl;

constructor( private http: HttpClient) { }

getCategoria():Observable<Categoria[]>{
  return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
}

updateCategoria(id: string, data: Partial<Categoria>): Observable<Categoria> {
  return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, data);
}

crearCategoria(data: Partial<Categoria>): Observable<Categoria> {
  return this.http.post<Categoria>(`${this.baseUrl}/categorias`, data);
}

}
