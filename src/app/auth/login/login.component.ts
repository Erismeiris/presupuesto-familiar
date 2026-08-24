import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators,FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
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
    private router:Router,
    private route:ActivatedRoute) {}

    login() {
      if (this.loginForm.valid) {
        const { username, password } = this.loginForm.value;
        this.auth.loginUser(username!, password!).subscribe({
          next: (res: any) => {
            // Aquí puedes validar la respuesta del backend
            if (res && res.success) {
              // Si el guard nos trajo aquí, se vuelve a esa página; si no, al
              // presupuesto, que es la pantalla de entrada de la aplicación.
              const destino = this.route.snapshot.queryParamMap.get('returnUrl') || '/presupuesto';
              this.router.navigateByUrl(destino);
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


