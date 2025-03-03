import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    HeaderComponent
  ],
  templateUrl: 'dashboard.component.html',
  styleUrl: 'dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
