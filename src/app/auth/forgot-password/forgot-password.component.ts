import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../dashboard/shared/header/header.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputTextModule, Message, HeaderComponent],
  templateUrl: './forgot-password.component.html',
  // Mismo aspecto que el login, del que se llega aquí.
  styleUrls: ['../login/login.component.css']
})
export class ForgotPasswordComponent {
  form = new FormGroup({
    usuario: new FormControl('', [Validators.required])
  });

  enviando = false;
  mensajeOk = '';
  mensajeError = '';

  constructor(private auth: AuthService) {}

  enviar() {
    if (this.form.invalid || this.enviando) return;

    this.enviando = true;
    this.mensajeOk = '';
    this.mensajeError = '';

    this.auth.forgotPassword(this.form.value.usuario!.trim()).subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.mensajeOk = res?.message || 'Si existe una cuenta con esos datos, te hemos enviado un correo.';
      },
      error: (err: any) => {
        this.enviando = false;
        this.mensajeError = err?.error?.message || 'No se ha podido enviar la solicitud.';
      }
    });
  }
}
