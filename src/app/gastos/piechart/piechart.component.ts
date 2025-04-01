import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { GastosService } from '../../services/gastos.service';
import { AuthService } from '../../services/auth.service';
import { Gastos } from '../../interface/user.interface';

@Component({
  selector: 'piechart',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './piechart.component.html',
  styleUrl: './piechart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiechartComponent implements OnInit {
  data: any;
  options: any;
  platformId = inject(PLATFORM_ID);
  gastos: Gastos[] = [
    {
        descripcion: 'Feria de coches en Huelva',
        monto: 10,
        date: '2025-03-28',
        categoria: 'Entretenimiento',
        name: 'Feria de coches',
        id: 'B5KHX4p2rUevRm9gOSBP',
        userId: 'GRTmiNxCQ6VTPRX8BbBXfVEdsLE3',
        },
        {
        descripcion: 'Feria de coches en Huelva',
        monto: 10,
        date: '2025-03-28',
        categoria: 'Entretenimiento',
        name: 'Feria de coches',
        id: 'B5KHX4p2rUevRm9gOSBP',
        userId: 'GRTmiNxCQ6VTPRX8BbBXfVEdsLE3',
    },
  ];

  dataSetLabels: string = 'users';

  //TODO: Agregar botones para los dataSetsAlbes Meses, Usuarios, Categorias, Años

  constructor(
    private cd: ChangeDetectorRef,
    private gastosServices: GastosService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initChart();
    this.getGastosIfUserIsLogged();
  }

  initChart() {
    this.data = {
      labels: ['User1', 'User2', 'User3', 'User4'],
      datasets: [
        {
          label: this.dataSetLabels,
          data: [540, 325, 702, 620],
          backgroundColor: [
            'rgba(249, 115, 22, 0.2)', //color: orange
            'rgba(6, 182, 212, 0.2)', //color: cyan
            'rgb(107, 114, 128, 0.2)', //color: gray
            'rgba(139, 92, 246, 0.2)', //color: purple
          ],
          borderColor: [
            'rgb(249, 115, 22)',
            'rgb(6, 182, 212)',
            'rgb(107, 114, 128)',
            'rgb(139, 92, 246)',
          ],
          borderWidth: 2,
        },
      ],
    };

    this.options = {
      plugins: {
        legend: {
          labels: {
            color: 'blue',
            font: {
              size: 20,
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: 'blue',
          },
          grid: {
            color: 'red',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'orage',
          },
          grid: {
            color: 'black',
          },
        },
      },
    };
    this.cd.markForCheck();
  }

  getGastosIfUserIsLogged() {
    const userUid = this.authService.user()?.uid;
    if (userUid) {
      this.gastosServices.getGastos(userUid).subscribe((gastos) => {
        this.gastos = gastos;
        console.log('Gastos:', this.gastos);
      });
    } else {
      console.log('No hay usuario logueado');
    }
  }
  viewBy(label: string) {
    if (label === 'users') {
      // Agrupar los datos usuarios
      const users = [];
      
      const getDataByUsers = this.gastos.map((gasto) => {      
      

      })     
      this.initChart(); // Reinicia el gráfico con los nuevos datos
    }
  }
}



    
    
  /* 
    {
        "descripcion": "Feria de coches en Huelva",
        "monto": "10",
        "date": "2025-03-28",
        "categoria": "Entretenimiento",
        "name": "Feria de coches",
        "id": "B5KHX4p2rUevRm9gOSBP",
        "userId": "GRTmiNxCQ6VTPRX8BbBXfVEdsLE3"
    }
    */