import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'piechart',
  imports: [
    ChartModule
  ],
  templateUrl: './piechart.component.html',
  styleUrl: './piechart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiechartComponent { 
  basicData = {
    labels: ['Padre', 'Madre', 'Gretel', 'Hija'],
    datasets: [
        {
            label: 'Gastos',
            data: [540, 325, 702, 620],
            backgroundColor: [
                'rgba(249, 115, 22, 0.2)',
                'rgba(6, 182, 212, 0.2)',
                'rgb(107, 114, 128, 0.2)',
                'rgba(139, 92, 246, 0.2)',
            ],
            borderColor: ['rgb(249, 115, 22)', 'rgb(6, 182, 212)', 'rgb(107, 114, 128)', 'rgb(139, 92, 246)'],
            borderWidth: 1,
        },
    ],
};

  basicOptions: any;

}
