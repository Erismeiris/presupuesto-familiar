import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../../dashboard/shared/header/header.component';
import { DATOS_LEGALES, hayDatosLegalesPendientes } from '../datos-legales';

/**
 * Política de Privacidad. Página pública: debe poder leerse antes de registrarse,
 * por eso tampoco lleva guard.
 */
@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './privacidad.component.html',
  styleUrls: ['../legal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacidadComponent {
  readonly datos = DATOS_LEGALES;
  readonly datosPendientes = hayDatosLegalesPendientes();
}
