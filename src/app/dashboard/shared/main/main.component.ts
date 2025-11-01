import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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
  user!: User | null ;
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


  constructor(private authservice: AuthService, private gastoServices: GastosService, private profileService: ProfileService) { 
    // Obtener el usuario correctamente desde el AuthService   
    console.log('User from AuthService:', this.user);
    
    this.getGastos();
    this.actualizarPorcentaje();
    this.gestionarColor();
  }

  ngOnInit(): void {
    this.tabs = [
      { title: 'Gráficos de gastos', value: 0, content: 'Tab 1 Content' },
      { title: 'Nuevos gastos', value: 1, content: 'Tab 2 Content' },
      { title: 'Transaciones', value: 2, content: 'Tab 3 Content' },
    ];
    
    // Usar el usuario ya obtenido en el constructor
    const userId = this.user?.uid;
    if (!userId) {
      console.error('No user ID available');
      return;
    }
    
    this.profileService.getProfileByUserId(userId).then(() => {
      this.profileService.profile$.subscribe(profile => {
        this.userProfile = profile;
        // Actualizar color después de obtener el perfil
        this.generalExpensive.color = this.userProfile?.color;
      });
    });
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
    // Verificar que el usuario esté disponible
    const currentUser = this.user || this.authservice.getCurrentUser();
    
    if (!currentUser?.uid) {
      console.error('No user available for getGastos');
      return;
    }
    
    console.log('Getting gastos for user:', currentUser.uid);
    
    // Remover 'await' ya que subscribe no devuelve una Promise
    this.gastoServices.getGastos(currentUser.uid).subscribe({
      next: (gastos) => {
        console.log('Gastos received:', gastos);
        this.generalExpensive.value = gastos.reduce((acc, curr) => acc + curr.monto, 0);    
        this.generalExpensive.color = this.userProfile?.color;
      },
      error: (error) => {
        console.error('Error getting gastos:', error);
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