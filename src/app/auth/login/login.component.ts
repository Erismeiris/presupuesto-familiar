import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators,FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Message } from 'primeng/message';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../dashboard/shared/header/header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CardModule, 
    FormsModule,
    HeaderComponent,
    ReactiveFormsModule,
    ButtonModule,
    CommonModule,
    InputTextModule,
    MenuModule,  
    ButtonModule,    
    RouterModule,
    Message 
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {


  errorMessages = ""


  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  public user: any = {};
  hide = false;

  constructor(
    private auth:AuthService, 
    private router:Router) {}  

    login() {
      if (this.loginForm.valid) {
        const { username, password } = this.loginForm.value;
        this.auth.loginUser(username!, password!).subscribe({
          next: (res: any) => {
            // Aquí puedes validar la respuesta del backend
            if (res && res.success) {
              this.router.navigate(['/dashboard']);
            } else {
              this.errorMessages = res?.message || 'Credenciales incorrectas.';
            }
          },
          error: (err: any) => {
            // Puedes personalizar el mensaje según el error recibido
            this.errorMessages = err?.error?.message || 'Error de autenticación.';
          }
        });
      } else {
        alert('Formulario inválido');
      }
    }
  }


