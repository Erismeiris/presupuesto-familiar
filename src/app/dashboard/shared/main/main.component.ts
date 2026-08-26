import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, OnInit } from '@angular/core';
import { SplitterModule } from 'primeng/splitter';
import { TabsModule } from 'primeng/tabs';
import { ExpensiveCardComponent } from '../../expensive_card/expensive_card.component';
import { CommonModule } from '@angular/common';
import { PiechartComponent } from '../../../gastos/piechart/piechart.component';
import { ExpensiveRegisterComponent } from '../../../gastos/expensiveRegister/expensiveRegister.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../interface/user.interface';
import { GastosService } from '../../../services/gastos.service';
import { ProfileService } from '../../../services/profile.service';
import { MessageService } from 'primeng/api';

export interface ExpensiveCard {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    SplitterModule,
    PiechartComponent,
    ExpensiveCardComponent,
    TabsModule,
    ExpensiveRegisterComponent
  ],
  providers: [MessageService],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit {  
  private messageService = inject(MessageService);
  userProfile: any;

  colorList = ['blue', 'green', 'yellow', 'red', 'purple', 'orange', 'pink', 'brown', 'black', 'gray'];
  tabs: { title: string; value: number; content: string }[] = [];

  public generalExpensive: ExpensiveCard = {
    name: 'Gastos Generales',
    value: 260,
    percentage: 0.2,
    color: '#08a644',
  };
 

  public expensiveCard: ExpensiveCard[] = [    
    {
      name: 'Padre',
      value: 100,
      percentage: 0,
      color: 'blue',
    },
    {
      name: 'Madre',
      value: 100,
      percentage: 0,
      color: 'blue',
    },
    {
      name: 'Abuelita',
      value: 50,
      percentage: 0,
      color: 'blue',
    },
    {
      name: 'Hermano',
      value: 50,
      percentage: 0,
      color: 'blue',
    },
    {
      name: 'Suegra',
      value: 50,
      percentage: 0,
      color: 'blue',
    }
    
     ];


  constructor(
    private authservice: AuthService, 
    private gastoServices: GastosService, 
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) { 
    // Usar effect() para reaccionar cuando el usuario cambie
    effect(() => {
      const user = this.authservice.user();
      console.log('User changed in effect:', user);
      this.getGastos();
      
      // Si hay usuario, cargar su perfil
      if (user?.uid) {
        this.profileService.getProfileByUserId(user.uid).then(() => {
          this.profileService.profile$.subscribe(profile => {
            this.userProfile = profile;
            this.generalExpensive.color = this.userProfile?.color;
            this.cdr.markForCheck();
          });
        });
      }
    });
  }

  ngOnInit(): void {
    this.tabs = [
      { title: 'Gráficos de gastos', value: 0, content: 'Tab 1 Content' },
      { title: 'Nuevos gastos', value: 1, content: 'Tab 2 Content' },
      { title: 'Transaciones', value: 2, content: 'Tab 3 Content' },
    ];
  }

  calculoGastosGenerales(): number {   
   const generalExpensives = this.expensiveCard.reduce((acc, curr) => acc + curr.value, 0);
    return generalExpensives
  }

  actualizarPorcentaje(): void {
    this.expensiveCard.forEach((expensive) => {
      expensive.percentage = expensive.value / this.generalExpensive.value;
    }
    );
  }

  gestionarColor(): void {  
    this.expensiveCard.forEach((expensive, index) => {
      expensive.color = this.colorList[index];
    });
  }

 async getGastos() {
    // Leer el usuario directamente de la señal
    const currentUser = this.authservice.user() || this.authservice.getCurrentUser();
    
    if (!currentUser?.uid) {
      console.log('No user available - using demo data');
      // Modo demo: usar datos de ejemplo
      this.generalExpensive.value = 260;
      this.actualizarPorcentaje();
      this.gestionarColor();
      this.cdr.markForCheck();
      return;
    }
    
    console.log('Getting gastos for user:', currentUser.uid);
    
    // Remover 'await' ya que subscribe no devuelve una Promise
    this.gastoServices.getGastos(currentUser.uid).subscribe({
      next: (gastos) => {
        console.log('Gastos received:', gastos);
        this.generalExpensive.value = gastos.reduce((acc, curr) => acc + curr.monto, 0);    
        this.generalExpensive.color = this.userProfile?.color;
        this.actualizarPorcentaje();
        this.gestionarColor();
        this.cdr.markForCheck();
      },
      error: (error) => {
        // 404 significa que el usuario no tiene gastos todavía
        if (error.status === 404) {
          console.log('Usuario sin gastos - mostrando 0');
          this.generalExpensive.value = 0;
        } else {
          console.error('Error getting gastos:', error);
          // En caso de error real, usar datos demo como fallback
          this.generalExpensive.value = 260;
        }
        this.actualizarPorcentaje();
        this.gestionarColor();
        this.cdr.markForCheck();
      }
    });
  }
}


/* categoria:"Alimentos"
date:"2025-03-08"
descripcion:"Compra en Mercadona"
id:"0CcuzjR1w7J6eaXoU59E"
monto:"12.31"
name:"Alimentos"
userId: "GRTmiNxCQ6VTPRX8BbBXfVEdsLE3" */