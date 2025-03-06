import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators,FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
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
    RouterModule, // Add RouterModule here
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
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

    console.log(this.loginForm.value);
    /* if (this.loginForm.valid) {
      // Lógica de inicio de sesión aquí
      this.auth.login(this.loginForm.value).then((res)=>{
        this.router.navigate(['/seguimiento-gastos']);
      }).catch((err)=>{
        console.log(err);
      })
    } else {
      this.snackBar.open('Por favor, complete todos los campos', 'Cerrar', {
        duration: 5000,
        verticalPosition: 'top',
      });
    } */
  }

}
