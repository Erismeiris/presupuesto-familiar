import { Injectable, OnInit } from '@angular/core';


import { collectionData, Firestore, collection, addDoc, deleteDoc, doc, updateDoc, where, query } from '@angular/fire/firestore';


import { Observable } from 'rxjs';
import { Gastos } from '../interface/user.interface';




@Injectable({
  providedIn: 'root'
})
export class GastosService implements OnInit {



  constructor( 
    private firestore: Firestore
   ) { }


ngOnInit(): void {
  
}

addGastos(gastos: Gastos){
  const newGastos = collection(this.firestore, 'gastos');
  return addDoc(newGastos, gastos)

}

//Get gastos by userID
getGastos(userId: string): Observable<Gastos[]> {
  const gastosRef = collection(this.firestore, 'gastos');
  const q = query(gastosRef, where('userId', '==', userId));
  return collectionData(q, { idField: 'id' }) as Observable<Gastos[]>;
}

deleteGastos(gasto:Gastos){
  const gastosRef = doc(this.firestore, `gastos/${gasto.id}`)
  return deleteDoc(gastosRef);

}

//Update gastos using firestore
updateData(documentId: string, newData: any): Promise<void> {
  const gastosRef = doc(this.firestore, `gastos/${documentId}`)
  return updateDoc(gastosRef, newData)
}

}
