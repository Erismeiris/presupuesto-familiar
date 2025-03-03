import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PrimeIcons, MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    Menubar,
       
     
    ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit{ 
  title = 'Control de Presupuesto Familiar';

  items: MenuItem[] | undefined;

  ngOnInit(): void {
    this.items = [
      {
          label: 'Inicio',
          icon: 'pi pi-home'
      },
      {
          label: 'Características',
          icon: 'pi pi-star'
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
          icon: 'pi pi-envelope'
      }
  ]
}
    
  }

