import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';
import { MainComponent } from './shared/main/main.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    HeaderComponent, 
    MainComponent
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { 
  private messageService = inject(MessageService);
}
