import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PrimeIcons, MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';



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

  items: MenuItem[] | undefined;

  public router = inject(Router)

  ngOnInit(): void {
    this.items = [
      {
          label: 'Inicio',
          icon: 'pi pi-home',
          route: 'dashboard'
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
                    route: 'login'
                },
                {
                    label: 'Perfil',
                    icon: 'pi pi-user-edit',
                    command: () => {
                        this.router.navigate(['user-profile']);
                    }
                    
                },
            ]
                
        }
  ]
}
    
  }

