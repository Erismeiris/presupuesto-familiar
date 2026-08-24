import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { UserProfileComponent } from './dashboard/user-profile/user-profile.component';
import { authGuard } from './guards/auth.guard';
import { SendInvitationComponent } from './dashboard/send-invitation-component/send-invitation-component';
import { InvitationsListComponent } from './dashboard/invitations-list/invitations-list.component';
import { PresupuestoPageComponent } from './presupuesto/presupuesto-page.component';

export const routes: Routes = [
    {path: 'dashboard',  component: DashboardComponent, data: {title: 'Dashboard'}},
    // Pantalla de entrada. Sin guard a propósito: quien no tiene cuenta ve el
    // presupuesto de ejemplo, y con sesión se cargan los datos reales.
    {path: 'presupuesto', component: PresupuestoPageComponent, data: {title: 'Presupuesto mensual'}},
    {path: 'login', component: LoginComponent, data: {title: 'Login'}},
    {path:'register', component: RegisterComponent, data: {title: 'Register'}},
    {path:'user-profile', component: UserProfileComponent, canActivate: [authGuard], data: {title: 'User Profile'}},    
    {
        path: 'invitations',
        title: 'Invitaciones',
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
    {path: '', redirectTo: '/presupuesto', pathMatch: 'full'},
    {path: '**', redirectTo: '/presupuesto'} // Ruta wildcard para manejar rutas no encontradas
];
