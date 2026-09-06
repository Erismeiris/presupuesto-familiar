import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../../dashboard/shared/header/header.component';
import { DATOS_LEGALES, hayDatosLegalesPendientes } from '../datos-legales';

/**
 * Términos de Servicio. Página pública: se enlaza desde el registro y el login,
 * así que no lleva guard.
 */
@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './terminos.component.html',
  styleUrls: ['../legal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerminosComponent {
  readonly datos = DATOS_LEGALES;
  readonly datosPendientes = hayDatosLegalesPendientes();
}
