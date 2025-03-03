import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { IconField } from 'primeng/iconfield';
import { InputIcon} from 'primeng/inputicon';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

import 'primeng/resources/themes/saga-blue/theme.css';
import 'primeng/resources/primeng.min.css';
import 'primeicons/primeicons.css';

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
          label: 'Home',
          icon: 'pi pi-home'
      },
      {
          label: 'Features',
          icon: 'pi pi-star'
      },
      {
          label: 'Projects',
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

