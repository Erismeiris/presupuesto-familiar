import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Gastos, User, UserProfile } from '../../interface/user.interface';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { FileUpload } from 'primeng/fileupload';
import { GastosService } from '../../services/gastos.service';
import { AuthService } from '../../services/auth.service';
import { ProgressBar } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import swal from 'sweetalert';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-expensive-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ToastModule,
    ToolbarModule,
    ProgressBar, 
    InputTextModule,
    ButtonModule
    
  ],
  templateUrl: './expensiveRegister.component.html',
  styleUrl: './expensiveRegister.component.css',  
  providers: [MessageService]
})
export class ExpensiveRegisterComponent {

 public todayDate = new Date().toISOString().split('T')[0];
 public userProfile!: UserProfile;

 isloading = true;
 public user!: User
 public gastos:Gastos[] = [];

  constructor(
    private gastosService: GastosService, 
    private userService: AuthService,
    private profileServices: ProfileService,
  ) {
   
   
  }

  ngOnInit(): void {  
    this.profileServices.profile$.subscribe((profile) => {
      this.userProfile = profile as UserProfile;
      
    });
     const userUid = this.userService.user()?.uid;  
      if (userUid) {
        this.getGastosByUserId(); 
      }else {
        this.gastos = [
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
        this.isloading = false;
      }
    
  }

  openNew() {
    const userUid = this.userService.user()?.uid;
    if(userUid){
    const newGasto = { 
      id: "",     
      categoria: "",
      date: this.todayDate.toString(),
      descripcion: "",
      monto: 0,
      name: "",    
      userId: userUid,
    };
    this.gastos.push(newGasto);
    
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
    if (gasto.id) {
      this.gastosService.updateData(gasto.id, gasto).then(() => {
        swal('Actualizado', 'El gasto ha sido actualizado.', 'success');
      }).catch((error) => {
        console.error('Error updating gasto:', error);
        swal('Error', 'Hubo un problema al actualizar el gasto.', 'error');
      });
    } else {
      // comprobar que no viene vacío
      if (gasto.categoria === "" || gasto.descripcion === "" || gasto.monto === 0 || gasto.name === "") {
        swal('Error', 'Todos los campos son obligatorios.', 'error');
      } else {
        this.gastosService.addGastos(gasto).then((docRef: { id: string }) => {
          gasto.id = docRef.id;
          this.gastos.push(gasto);
          swal('Guardado', 'El gasto ha sido guardado.', 'success');
        }).catch((error) => {
          console.error('Error adding gasto:', error);
          swal('Error', 'Hubo un problema al guardar el gasto.', 'error');
        });
      }
    }
  }

async deleteGasto(gasto: Gastos) {
  const result = await swal({
    title: '¿Estás seguro?',
    text: "¡No podrás revertir esto!",
    buttons: {
      cancel: {
        text: 'Cancelar',
        value: null,
        visible: true,
        className: '',
        closeModal: true,
      },
      confirm: {
        text: 'Sí, bórralo!',
        value: true,
        visible: true,
        className: 'btn-primary',
        closeModal: true,
      }
    },
    icon: 'warning'
  });

  if (result) {
    if (this.user && this.user.uid) {
      try {
        await this.gastosService.deleteGastos(gasto);
        this.gastos = this.gastos.filter((g) => g.id !== gasto.id); // Actualizar la lista de gastos
        swal('¡Borrado!', 'El gasto ha sido borrado.', 'success');
      } catch (error) {
        console.error('Error deleting gasto:', error);
        swal('Error', 'Hubo un problema al borrar el gasto.', 'error');
      }
    } else {
      // delete gasto from array
      this.gastos = this.gastos.filter((g) => g.id !== gasto.id);
      swal('¡Borrado!', 'El gasto ha sido borrado.', 'success');
    }
  }
}

     
   getGastosByUserId(){
    const userUid = this.userService.user()?.uid;
    if(userUid){
      this.gastosService.getGastos(userUid).subscribe((gastos) => {
        this.gastos = gastos;  
        this.isloading = false;      
      });
    }
   }
  

 }
