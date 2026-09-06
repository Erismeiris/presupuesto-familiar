import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { AuthService } from '../../../services/auth.service';
import swal from 'sweetalert';
import { MessageService } from 'primeng/api';


@Component({
    selector: 'app-header',
    standalone: true,
    imports: [
        Menubar,
        CommonModule,
        RouterModule,
        PrimeTemplate
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit{ 
    title = 'Control de Presupuesto Familiar';
    private messageService = inject(MessageService);

  items: MenuItem[] | undefined;

  public router = inject(Router)

  public authService = inject(AuthService)

  /**
   * El menú se limita a las opciones de perfil. La navegación a la pantalla de
   * entrada se hace pulsando la marca de la aplicación (plantilla `start`).
   */
  ngOnInit(): void {
    this.items = [
        {
            label: 'Sesión',
            icon: 'pi pi-user',
            items: [
                {
                    label: 'Perfil',
                    icon: 'pi pi-user-edit',
                    command: () => {
                        this.router.navigate(['user-profile']);
                    }
                },
                {
                    label: 'Login',
                    icon: 'pi pi-sign-in',
                    command: () => {
                        this.router.navigate(['login']);
                    }
                },
                {
                    label: 'Cerrar Sesión',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        this.logout();
                    }
                }
            ]
        }
    ]
}

/** Vuelve a la pantalla de entrada de la aplicación. */
irAPresupuesto() {
    this.router.navigate(['/presupuesto']);
}

logout() {
    swal({
        title: "¿Estás seguro?",
        text: "¿Quieres cerrar la sesión?",
        icon: "warning",
        buttons: ["Cancelar", "Cerrar sesión"],
        dangerMode: true,
    })
    .then((willLogout) => {
        if (willLogout) {
        // Al presupuesto, no al login: es la pantalla de entrada y funciona sin
        // sesión mostrando el presupuesto de ejemplo.
        this.authService.logoutUser().then(() => {
            this.router.navigate(['/presupuesto']);
        });
        }
    });
}
    
}
