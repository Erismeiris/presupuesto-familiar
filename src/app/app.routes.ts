import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { UserProfileComponent } from './dashboard/user-profile/user-profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {path: 'dashboard',  component: DashboardComponent, data: {title: 'Dashboard'}},    
    {path: 'login', component: LoginComponent, data: {title: 'Login'}},
    {path:'register', component: RegisterComponent, data: {title: 'Register'}},
    {path:'user-profile', component: UserProfileComponent, canActivate: [authGuard], data: {title: 'User Profile'}},    
    {path: '', redirectTo: '/dashboard', pathMatch: 'full'}
];
 