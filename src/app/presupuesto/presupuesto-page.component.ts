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
      /* El papel a sangre completa cuelga del :host, no del <main>, para que el
         tono llegue a los bordes de la ventana y no quede una franja blanca
         debajo del contenido. La tipografia se aplica aqui y no en :root para
         no arrastrar al resto de la aplicacion, que sigue con la pila del
         sistema: esta direccion visual esta acotada al presupuesto. */
      :host {
        display: block;
        min-height: 100vh;
        background: var(--pf-papel-2);
        font-family: var(--pf-fuente-texto);
        color: var(--pf-tinta);
      }

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
