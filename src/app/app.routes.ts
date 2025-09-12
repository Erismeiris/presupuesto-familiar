import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { UserProfileComponent } from './dashboard/user-profile/user-profile.component';
import { authGuard } from './guards/auth.guard';
import { SendInvitationComponent } from './dashboard/send-invitation-component/send-invitation-component';
import { InvitationsListComponent } from './dashboard/invitations-list/invitations-list.component';

export const routes: Routes = [
    {path: 'dashboard',  component: DashboardComponent, data: {title: 'Dashboard'}},    
    {path: 'login', component: LoginComponent, data: {title: 'Login'}},
    {path:'register', component: RegisterComponent, data: {title: 'Register'}},
    {path:'user-profile', component: UserProfileComponent, canActivate: [authGuard], data: {title: 'User Profile'}},    
    {
        path: 'invitations',
        canActivate: [authGuard], // Proteger toda la sección de invitations
        children: [
            {
                path: 'send',
                component: SendInvitationComponent,
                data: { title: 'Enviar Invitación' }
            },
            {
                path: 'list',
                component: InvitationsListComponent,
                data: { title: 'Mis Invitaciones' }
            },
            {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full'
            }
        ]
    },
    {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
    {path: '**', redirectTo: '/dashboard'} // Ruta wildcard para manejar rutas no encontradas
];
