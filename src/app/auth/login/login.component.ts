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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CardModule, 
    FormsModule,
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
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  public user: any = {};
  hide = false;

  constructor(
    private auth:AuthService, 
    private router:Router) {}  

    login() {
    
    if (this.loginForm.valid) {
      // Lógica de inicio de sesión aquí
      const { email, password } = this.loginForm.value;
      this.auth.loginUser(email!,password!).then((res)=>{
        this.router.navigate(['/dashboard']);
      }).catch((error)=>{
        switch (error.code) {
          case 'auth/user-not-found':
            this.errorMessages = 'Usuario no encontrado.';
            break;
          case 'auth/wrong-password':
            this.errorMessages = 'Contraseña incorrecta.';
            break;
          case 'auth/invalid-email':
            this.errorMessages = 'Correo electrónico inválido.';
            break;
          case 'auth/user-disabled':
            this.errorMessages = 'Usuario deshabilitado.';
            break;
          case 'auth/too-many-requests':
            this.errorMessages = 'Demasiados intentos. Inténtalo más tarde.';
            break;
          case 'auth/network-request-failed':
            this.errorMessages = 'Error de conexión de red.';
            break;
          case 'auth/operation-not-allowed':
            this.errorMessages = 'Operación no permitida.';
            break;
          default:
            this.errorMessages = 'Error desconocido.';
            break;
        }
      })
    } else {
      alert('Formulario inválido');
      }; 
    } 
  }


