import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from '@angular/fire/firestore';
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



addCategoria(categoria: Categoria){
  

}

getCategoria():Observable<Categoria[]>{
  const url = `${this.baseUrl}/categorias`;
  return this.http.get<Categoria[]>(url);
}

}
