import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../dashboard/shared/header/header.component';

const coinciden = (grupo: AbstractControl): ValidationErrors | null =>
  grupo.get('password')?.value === grupo.get('confirmar')?.value ? null : { noCoinciden: true };

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PasswordModule, Message, HeaderComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ResetPasswordComponent implements OnInit {
  // Misma longitud mínima que el registro y que valida el backend.
  form = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmar: new FormControl('', [Validators.required])
  }, { validators: coinciden });

  token = '';
  enviando = false;
  hecho = false;
  mensajeOk = '';
  mensajeError = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.mensajeError = 'El enlace no es válido. Solicita uno nuevo.';
    }
  }

  guardar() {
    if (this.form.invalid || this.enviando || !this.token) return;

    this.enviando = true;
    this.mensajeError = '';

    this.auth.resetPassword(this.token, this.form.value.password!).subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.hecho = true;
        this.mensajeOk = res?.message || 'Contraseña actualizada.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.enviando = false;
        this.mensajeError = err?.error?.message || 'No se ha podido cambiar la contraseña.';
      }
    });
  }
}
