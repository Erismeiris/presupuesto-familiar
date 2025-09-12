import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PrimeIcons, MenuItem } from 'primeng/api';
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
        RouterModule     
        
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

  ngOnInit(): void {
    this.items = [
      {
          label: 'Inicio',
          icon: 'pi pi-home',
         command: () => {
            this.router.navigate(['dashboard']);
        }
      },
      {
          label: 'Documentación',
          icon: 'pi pi-info',
          route: 'documentation'
      },
      {
          label: 'Planes',
          icon: 'pi pi-search',
          items: [
              {
                  label: 'Components',
                  icon: 'pi pi-bolt'
              },
              {
                  label: 'Blocks',
                  icon: 'pi pi-server'
              },
              {
                  label: 'UI Kit',
                  icon: 'pi pi-pencil'
              },
              {
                  label: 'Templates',
                  icon: 'pi pi-palette',
                  items: [
                      {
                          label: 'Apollo',
                          icon: 'pi pi-palette'
                      },
                      {
                          label: 'Ultima',
                          icon: 'pi pi-palette'
                      }
                  ]
              }
          ]
      },
      {
          label: 'Contact',
          icon: 'pi pi-envelope',
         route: 'contact'
      },
        {
            label: 'Sesión',
            icon: 'pi pi-user',
            items: [
                {
                    label: 'Cerrar Sesión',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        this.logout(); // Call logout method
                    }
                },
                {
                    label: 'Perfil',
                    icon: 'pi pi-user-edit',
                    command: () => {
                        this.router.navigate(['user-profile']);
                    }
                    
                },
                {
                    label: 'Login',
                    icon: 'pi pi-user-edit',
                    command: () => {
                        this.router.navigate(['login']);
                    }
                    
                },

            ]
                
        },
        {
          label: 'Notificaciones',
          icon: 'pi pi-bell',
         command: () => {
                        this.router.navigate(['invitations']);
                    }
      },
  ]
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
        this.authService.logoutUser().then(() => {
            this.router.navigate(['/login']);
        });
        }
    });
}
    
}

