import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Gastos } from '../../interface/user.interface';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { FileUpload } from 'primeng/fileupload';

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
    ButtonModule,
    FileUpload
  ],
  templateUrl: './expensiveRegister.component.html',
  styleUrl: './expensiveRegister.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensiveRegisterComponent {

 public todayDate = new Date().toISOString().split('T')[0];
  public gastos:Gastos[] = [
    {
      id: "1",
      categoria: "Comida",
      date: "2021-10-10",
      descripcion: "Comida",
      monto: 100,
      name: "Comida",
      tasa_de_cambio: 1,
      userId: "1"
    },
    {
      id: "2",
      categoria: "Comida",
      date: "2021-10-10",
      descripcion: "Comida",
      monto: 100,
      name: "Comida",
      tasa_de_cambio: 1,
      userId: "1"
    },
    {
      id: "3",
      categoria: "Comida",
      date: "2021-10-10",
      descripcion: "Comida",
      monto: 100,
      name: "Comida",
      tasa_de_cambio: 1,
      userId: "1"
    }
  ];

 

  openNew() {
    this.gastos.push({
      id: "",
      categoria: "",
      date: this.todayDate,
      descripcion: "",
      monto: 0,
      name: "",
      tasa_de_cambio: 0,
      userId: "",});
   
}
 }
