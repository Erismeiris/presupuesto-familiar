import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Regla } from '../interface/regla.interface';

@Injectable({
  providedIn: 'root'
})
export class ReglaService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getReglas(): Observable<Regla[]> {
    return this.http.get<Regla[]>(`${this.baseUrl}/reglas`);
  }

  createRegla(regla: Pick<Regla, 'patron' | 'categoria'>): Observable<Regla> {
    return this.http.post<Regla>(`${this.baseUrl}/reglas`, regla);
  }
}
