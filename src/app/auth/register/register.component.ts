import { CommonModule } from '@angular/common';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { HeaderComponent } from '../../dashboard/shared/header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToastModule } from 'primeng/toast';
import { timeout } from 'rxjs';


@Component({
  standalone: true,
  imports: [
    // Import the Angular Material module
    CommonModule,
    FormsModule,
    HeaderComponent,
    ReactiveFormsModule,
    MessageModule,
    RouterModule,
    HttpClientModule,
    ToastModule,
    SplitButtonModule
  ],
  providers: [MessageService],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  registerForm!: FormGroup
  fb = inject(FormBuilder)
  
  

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms: [false, [Validators.requiredTrue]],
      confirmPassword: ['', [Validators.required]],
    }, {
      validators: this.passwordMatchValidator});
  }
 
  // Custom validator to check if password and confirmPassword match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
  }
 
 
  constructor(
    //private snackBar: MatSnackBar,
    private auth: AuthService,
    private route: Router,
    private messageService: MessageService
  ) {}

  register() {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;
      const {userName, email, password} = data;
      console.log('Registering user:', userName, email, password);
      
      
      // Usar el método para backend en lugar de Firebase
      this.auth.registerUser(userName, email, password)
      .subscribe({
        next: (res) => {
          console.log('Registration successful:', res);
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Registro exitoso', 
            detail: 'Usuario registrado correctamente',
            life: 5000
          });
          // Esperar un poco antes de navegar para que se vea el toast
          setTimeout(() => {
            this.route.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          console.error('Registration failed:', err);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error de registro', 
            detail: err.error?.message || 'Error al registrar usuario',
            life: 5000
          });
        }
      });
    } else {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Formulario inválido', 
        detail: 'Por favor completa todos los campos correctamente',
        life: 3000
      });
    }
  }
 
  matchConfirmPassword(control: FormControl) {
    const password:any = this.registerForm.controls['password'].value  || '';
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  

 
  
  signUpWithGoogle() {
    console.log('Attempting to sign up with Google');
    // Here you would implement Google authentication
    // Typically using Firebase Authentication or another auth provider
  }
 

}
