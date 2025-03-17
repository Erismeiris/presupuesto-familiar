import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ChartModule } from 'primeng/chart';



@Component({
  selector: 'piechart',
  standalone: true,
  imports: [
    ChartModule,
  ],
  templateUrl: './piechart.component.html',
  styleUrl: './piechart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiechartComponent implements OnInit { 

    data: any;

    options: any;

    platformId = inject(PLATFORM_ID);

    

    constructor(private cd: ChangeDetectorRef) {}

    

    ngOnInit() {
        this.initChart();
    }

    initChart() {      

            this.data = {
                labels: ['User1', 'User2', 'User3', 'User4'],
                datasets: [
                    {
                        label: 'Sales',
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

            this.options = {
                plugins: {
                    legend: {
                        labels: {
                            color: 'yellow',
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
            this.cd.markForCheck()
        }
    
}
