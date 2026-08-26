import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Gastos } from '../interface/user.interface';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface GastosResponse {
  gastos: Gastos[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class GastosService implements OnInit {
private baseUrl = environment.apiUrl;


  constructor( 
    private http: HttpClient,
   ) { }


ngOnInit(): void {
  
}

//Get gastos by userID
getGastos(userId: string): Observable<Gastos[]> {
  const url = `${this.baseUrl}/gastos/user/${userId}`;
  return this.http.get<GastosResponse | Gastos[]>(url).pipe(
    map(res => Array.isArray(res) ? res : (res.gastos ?? []))
  );
}

deleteGastos(gasto: Gastos): Observable<any> {
  const url = `${this.baseUrl}/gastos/${gasto.id}`;
  return this.http.delete(url);
}

//Update gastos using firestore
updateData(id: string, data: Partial<Gastos>): Observable<Gastos> {
  const url = `${this.baseUrl}/gastos/${id}`;
  return this.http.put<Gastos>(url, data);
}

createGasto(gasto: Gastos): Observable<Gastos> {
  const url = `${this.baseUrl}/gastos`;
  return this.http.post<Gastos>(url, gasto);
}

createGastoConIA(payload: { descripcion: string; cantidad: number; fecha: string; userId: string }): Observable<Gastos> {
  return this.http.post<Gastos>(`${this.baseUrl}/gastos/ia`, payload);
}

clasificarGasto(descripcion: string, cantidad: number): Observable<{ categoriaClasificada: string; categoriaId: string | null }> {
  return this.http.post<{ categoriaClasificada: string; categoriaId: string | null }>(`${this.baseUrl}/gastos/clasificar`, { descripcion, cantidad });
}

}
