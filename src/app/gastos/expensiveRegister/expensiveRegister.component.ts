import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
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
import { Categoria } from '../../interface/categoria';
import { CategoriaService } from '../../services/categoria.service';
import { PresupuestoService } from '../../services/presupuesto.service';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';


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
    ButtonModule,
    DropdownModule,
    TooltipModule
  ],
  templateUrl: './expensiveRegister.component.html',
  styleUrl: './expensiveRegister.component.css',  
  providers: [MessageService]
})
export class ExpensiveRegisterComponent {

 public todayDate = new Date().toISOString().split('T')[0];
 public userProfile!: UserProfile;
 public categoriaList!: Categoria[];

 isloading = true;
 public user!: User
 public gastos:Gastos[] = [];

  constructor(
    private gastosService: GastosService, 
    private categoriaService: CategoriaService,
    private userService: AuthService,
    private profileServices: ProfileService,
    private presupuestoService: PresupuestoService,
  ) {
    effect(() => {
      const user = this.userService.user();
      console.log('User changed in expensiveRegister:', user);
      this.loadUserData();
    });

    // Sincroniza las categorías del dropdown con las líneas del presupuesto
    effect(() => {
      const resumen = this.presupuestoService.resumen();
      if (!resumen) return;
      this.categoriaList = resumen.gastos.lineas
        .filter(l => l.categoriaId !== null && l.presupuestada)
        .map(l => ({
          id: l.categoriaId!,
          nombre: l.nombre,
          descripcion: '',
          public: true,
          userId: '',
          tipo503020: l.tipo503020
        }));
    });
  }

  ngOnInit(): void {  
    // El effect en el constructor se encarga de cargar los datos
  }

  private loadUserData(): void {
    const userUid = this.userService.user()?.uid;
    
    if (userUid) {
      // Usuario autenticado: cargar categorías y gastos reales
      console.log('Loading data for authenticated user:', userUid);
      this.isloading = true;
      
      this.profileServices.profile$.subscribe({
        next: (profile) => {
          this.userProfile = profile as UserProfile;
          this.presupuestoService.cargarResumen();
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.isloading = false;
        }
      });
      
      this.getGastosByUserId();
    } else {
      // Sin usuario: mostrar datos de ejemplo
      console.log('No user - loading demo data');
      this.gastos = [
        {
          id: undefined,
          categoria: "Alimentos",
          categoriaId: "1",
          date: "12/12/2025",
          descripcion: "Compra regalo a mi Esposa/Esposa",
          monto: 100,
          name: "Lázaro Cárdenas",
          userId: ""
        }
      ];
      
      // Cargar categorías de ejemplo
      this.categoriaList = [
        { id: "1", nombre: "Alimentos", descripcion: "Comida y bebidas", public: true, userId: "", tipo503020: "necesidades" },
        { id: "2", nombre: "Transporte", descripcion: "Gastos de movilidad", public: true, userId: "", tipo503020: "necesidades" },
        { id: "3", nombre: "Vivienda", descripcion: "Alquiler y servicios", public: true, userId: "", tipo503020: "necesidades" },
        { id: "4", nombre: "Servicios", descripcion: "Luz, agua, internet", public: true, userId: "", tipo503020: "necesidades" },
        { id: "5", nombre: "Entretenimiento", descripcion: "Diversión y ocio", public: true, userId: "", tipo503020: "deseos" },
        { id: "6", nombre: "Restaurantes", descripcion: "Comer fuera", public: true, userId: "", tipo503020: "deseos" },
        { id: "7", nombre: "Compras", descripcion: "Compras varias", public: true, userId: "", tipo503020: "deseos" },
        { id: "8", nombre: "Ahorro", descripcion: "Dinero ahorrado", public: true, userId: "", tipo503020: "ahorro" },
        { id: "9", nombre: "Inversiones", descripcion: "Inversiones financieras", public: true, userId: "", tipo503020: "ahorro" }
      ];
      
      this.isloading = false;
    }
  }

  openNew() {
    const userUid = this.userService.user()?.uid;
    if(userUid){
    const newGasto: Gastos = { 
      id: undefined,     
      categoria: "",
      categoriaId: undefined,
      date: this.todayDate.toString(),
      descripcion: "",
      monto: 0,
      name: "",    
      userId: userUid,
    };
    this.gastos.push(newGasto);
    
  }else{
    this.gastos.push({
      id: undefined,
      categoria: "",
      categoriaId: undefined,
      date: this.todayDate.toString(),
      descripcion: "",
      monto: 0,
      name: "",
      userId: ""
    });
  }
  }

  // Método para actualizar el nombre de la categoría cuando se selecciona en el dropdown
  onCategoriaChange(event: any, gasto: Gastos) {
    const categoriaId = event.value;
    const categoria = this.categoriaList.find(c => c.id === categoriaId);
    if (categoria) {
      gasto.categoria = categoria.nombre;
      gasto.categoriaId = categoriaId;
    }
  }

  
  updateGasto(gasto: Gastos) {
    // Validar que todos los campos obligatorios estén completos
    if (!gasto.categoriaId || !gasto.descripcion || !gasto.monto || !gasto.name || !gasto.date) {
      swal('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    const userUid = this.userService.user()?.uid;
    
    // Modo demo (sin usuario autenticado o userId vacío): simular guardado localmente
    if (!userUid || !gasto.userId) {
      // Generar un ID falso para el modo demo
      const demoId = 'demo-' + Date.now();
      const index = this.gastos.findIndex(g => g === gasto);
      if (index !== -1) {
        this.gastos[index] = { ...gasto, id: demoId, userId: '' };
      }
      swal('Modo Demo', 'El gasto ha sido guardado localmente. Inicia sesión para guardar en el servidor.', 'info');
      return;
    }

    // Crear un payload limpio solo con los campos válidos
    const payload: any = {
      categoriaId: gasto.categoriaId,
      date: gasto.date,
      descripcion: gasto.descripcion,
      monto: Number(gasto.monto),
      userId: gasto.userId,
      name: gasto.name
    };
    
    // Agregar sharedWith si existe
    if (gasto.sharedWith && gasto.sharedWith.length > 0) {
      payload.sharedWith = gasto.sharedWith;
    }

    // Si tiene ID real (no demo), es una actualización
    if (gasto.id && !gasto.id.startsWith('demo-')) {
      this.gastosService.updateData(gasto.id, payload).subscribe({
        next: (updatedGasto) => {
          // Actualizar el objeto local con los datos del servidor
          const index = this.gastos.findIndex(g => g === gasto);
          if (index !== -1) {
            this.gastos[index] = { ...updatedGasto, categoria: gasto.categoria };
          }
          swal('Actualizado', 'El gasto ha sido actualizado.', 'success');
        },
        error: (error) => {
          console.error('Error updating gasto:', error);
          swal('Error', 'Hubo un problema al actualizar el gasto.', 'error');
        }
      });
    } else {
      // Si no tiene ID o es un ID demo, es un nuevo gasto
      this.gastosService.createGasto(payload).subscribe({
        next: (newGasto) => {
          // Actualizar el gasto en el array con el ID devuelto por el servidor
          const index = this.gastos.findIndex(g => g === gasto);
          if (index !== -1) {
            this.gastos[index] = { ...newGasto, categoria: gasto.categoria };
          }
          swal('Guardado', 'El gasto ha sido guardado.', 'success');
        },
        error: (error) => {
          console.error('Error creating gasto:', error);
          swal('Error', 'Hubo un problema al guardar el gasto.', 'error');
        }
      });
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
    const userUid = this.userService.user()?.uid;
    
    // Modo demo o ID demo: solo eliminar localmente
    if (!userUid || (gasto.id && gasto.id.startsWith('demo-')) || !gasto.id) {
      this.gastos = this.gastos.filter((g) => g !== gasto);
      swal('¡Borrado!', 'El gasto ha sido eliminado localmente.', 'success');
      return;
    }
    
    // Si el gasto tiene ID real, eliminarlo del backend
    if (gasto.id) {
      this.gastosService.deleteGastos(gasto).subscribe({
        next: () => {
          this.gastos = this.gastos.filter((g) => g.id !== gasto.id);
          swal('¡Borrado!', 'El gasto ha sido borrado.', 'success');
        },
        error: (error) => {
          console.error('Error deleting gasto:', error);
          swal('Error', 'Hubo un problema al borrar el gasto.', 'error');
        }
      });
    }
  }
}

     
   getGastosByUserId(){
    const userUid = this.userService.user()?.uid;
    if(userUid){
      this.gastosService.getGastos(userUid).subscribe({
        next: (gastos) => {
          this.gastos = gastos;  
          this.isloading = false;      
        },
        error: (error) => {
          // 404 significa que el usuario no tiene gastos todavía
          if (error.status === 404) {
            console.log('Usuario sin gastos - inicializando array vacío');
          } else {
            console.error('Error loading gastos:', error);
          }
          this.gastos = [];
          this.isloading = false;
        }
      });
    } else {
      this.isloading = false;
    }
   }

  getCategorias(): void {
    this.categoriaService.getCategoria().subscribe({
      next: (categorias) => {
        this.categoriaList = categorias;
        console.log('Categorías cargadas:', this.categoriaList);
      },
      error: (error) => {
        console.error('Error loading categorias:', error);
        this.categoriaList = [];
      }
    });
  }

 }
