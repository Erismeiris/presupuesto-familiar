import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HeaderComponent } from '../dashboard/shared/header/header.component';
import { ResumenComponent } from './resumen/resumen.component';

/**
 * Página del presupuesto mensual. Solo pone el marco (header + ancho de lectura)
 * para que el resumen siga sirviendo tal cual dentro del dashboard.
 */
@Component({
  selector: 'app-presupuesto-page',
  standalone: true,
  imports: [HeaderComponent, ResumenComponent],
  template: `
    <app-header />
    <main class="pagina-presupuesto">
      <app-resumen />
    </main>
  `,
  styles: [
    `
      .pagina-presupuesto {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresupuestoPageComponent {}
