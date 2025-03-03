import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';
import { MainComponent } from './shared/main/main.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    HeaderComponent, 
    MainComponent
  ],
  templateUrl: 'dashboard.component.html',
  styleUrl: 'dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
