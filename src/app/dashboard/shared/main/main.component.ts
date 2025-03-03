import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SplitterModule } from 'primeng/splitter';
import { TabsModule } from 'primeng/tabs';
import { ExpensiveCardComponent } from '../../expensive_card/expensive_card.component';
import { CommonModule } from '@angular/common';
import { PiechartComponent } from '../../../gastos/piechart/piechart.component';

export interface ExpensiveCard {
  title: string;
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
    TabsModule
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit {  

  colorList = ['blue', 'green', 'yellow', 'red', 'purple', 'orange', 'pink', 'brown', 'black', 'gray'];
  tabs: { title: string; value: number; content: string }[] = [];

  public generalExpensive: ExpensiveCard = {
    title: 'Gastos Generales',
    value: 0,
    percentage: 0.2,
    color: 'red',
  };


  public expensiveCard: ExpensiveCard[] = [    
    {
      title: 'Padre',
      value: 100,
      percentage: 0,
      color: 'blue',
    },
    {
      title: 'Madre',
      value: 100,
      percentage: 0,
      color: 'blue',
    },
    {
      title: 'Gretel',
      value: 50,
      percentage: 0,
      color: 'blue',
    },
    {
      title: 'Hansel',
      value: 50,
      percentage: 0,
      color: 'blue',
    },
    {
      title: 'Bruja',
      value: 50,
      percentage: 0,
      color: 'blue',
    },
    {
      title: 'Casa de dulces',
      value: 50,
      percentage: 0,
      color: 'blue',
    }
     ];


  constructor() {  
   this.generalExpensive.value = this.calculoGastosGenerales();
   this.actualizarPorcentaje();
   this.gestionarColor();
    
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
   
}
