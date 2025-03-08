import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MeterGroup, MeterGroupModule } from 'primeng/metergroup';

@Component({
  selector: 'expensive-card',
  imports: [
    CommonModule,
    MeterGroupModule,
    MeterGroup
  ],
  templateUrl: './expensive_card.component.html',
  styleUrls: ['./expensive_card.component.css'], // Fixed typo here
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensiveCardComponent implements OnChanges { 
  @Input() title!: string;
  @Input() value!: number;
  @Input() percentage!: number;
  @Input() color!: string;

  public percent = [
    { label: 'Gastos en porciento', value: this.percentage, color: this.color }];

  styleObject: { [key: string]: string } = {};

  ngOnInit(): void {    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color']) {
      this.styleObject = { 'background-color': this.color };
    }

    if(changes['percentage']) {
      this.percent = [
        { label: 'Gastos en porciento', value: (this.percentage*100), color: this.color }
      ];

      
    }
  }
}
