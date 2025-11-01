import { Injectable, OnInit } from '@angular/core';


import { collectionData, Firestore, collection, addDoc, deleteDoc, doc, updateDoc, where, query } from '@angular/fire/firestore';


import { Observable } from 'rxjs';
import { Gastos } from '../interface/user.interface';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';




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

addGastos(gastos: Gastos){
  //const newGastos = collection(this.firestore, 'gastos');
  //return addDoc(newGastos, gastos)

}

//Get gastos by userID
getGastos(userId: string): Observable<Gastos[]> {
  const url = `${this.baseUrl}/gastos/user/${userId}`;
  const gastos = this.http.get<Gastos[]>(url);
  return gastos;
}

deleteGastos(gasto:Gastos){
  //const gastosRef = doc(this.firestore, `gastos/${gasto.id}`)
  //return deleteDoc(gastosRef);

}

//Update gastos using firestore
updateData(id: string, data: Partial<Gastos>) {
  const url = `${this.baseUrl}/gastos/${id}`;
  return this.http.put(url, data);
}

createGasto(gasto: Gastos): Observable<Gastos> {
  const url = `${this.baseUrl}/gastos`;
  return this.http.post<Gastos>(url, gasto);
}

}
