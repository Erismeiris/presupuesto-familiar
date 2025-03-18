import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Gastos, User } from '../../interface/user.interface';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { FileUpload } from 'primeng/fileupload';
import { GastosService } from '../../services/gastos.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-expensive-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ToastModule,
    ToolbarModule, 
    InputTextModule,
    ButtonModule
    
  ],
  templateUrl: './expensiveRegister.component.html',
  styleUrl: './expensiveRegister.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensiveRegisterComponent {

 public todayDate = new Date().toISOString().split('T')[0];
 public user!: User
 public gastos:Gastos[] = [
  {
    id: "",
    categoria: "Alimentos",
    date: "12/12/2025",
    descripcion: "Compra regalo a mi Esposa/Esposo",
    monto: 100,
    name: "Lázaro Cárdenas",
    userId: ""
  }
 ];

  constructor(private gastosService: GastosService, private userService: AuthService, private ngZone: NgZone) {
   
   
  }

  ngOnInit(): void {  
    this.userService.getUserLogged().subscribe((user) => {
      this.ngZone.run(() => {
        this.user = user;
        if (this.user && this.user.uid) {
          this.getGastosByUserId(); 
        }
      });
    });
  }

  openNew() {

    if(this.user && this.user.uid){
    const newGasto = { 
      id: "",     
      categoria: "",
      date: this.todayDate.toString(),
      descripcion: "",
      monto: 0,
      name: "",    
      userId: this.user.uid,
    };
    this.gastosService.addGastos(newGasto).then((docRef: { id: string }) => {
      newGasto.id = docRef.id;
      this.gastos.push(newGasto);
    });
  }else{
    this.gastos.push({
      id: "",
      categoria: "",
      date: this.todayDate.toString(),
      descripcion: "",
      monto: 0,
      name: "",
      userId: ""
    });
  }
  }

  updateGasto(gasto: Gastos) {
   if(gasto.id){
    this.gastosService.updateData(gasto.id, gasto);
    
   }else{
     console.log('No se puede actualizar el gasto');
     };
   }

  deleteGasto(gasto: Gastos) {
    if(this.user && this.user.uid){
      this.gastosService.deleteGastos(gasto).then(() => {
        this.getGastosByUserId();
      });
    }else{
      //delete gasto from array
      this.gastos = this.gastos.filter((g) => g.id !== gasto.id);
    }
   
  }
     
   getGastosByUserId(){
    if(this.user && this.user.uid){
      this.gastosService.getGastos(this.user.uid).subscribe((gastos) => {
        this.gastos = gastos;        
      });
    }
   }
  

 }
