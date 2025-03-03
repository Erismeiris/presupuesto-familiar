import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';



export const routes: Routes = [
    {path: 'dashboard',  component: DashboardComponent, data: {title: 'Dashboard'}},
    {path: '',  component: DashboardComponent, data: {title: 'Dashboard'}},
];
