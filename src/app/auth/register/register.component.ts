import { CommonModule } from '@angular/common';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageModule } from 'primeng/message';

@Component({
  standalone: true,
  imports: [
    // Import the Angular Material module
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    RouterModule,
  ],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  registerForm!: FormGroup
  fb = inject(FormBuilder)

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
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
    /* private snackBar: MatSnackBar, 
    private auth: AuthService, */
    private route: Router) {}

  /* register() {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;
      // Envía los datos del formulario a tu servidor
      const {email, password} = data;
      this.auth.register({email, password})
      .then( res => {
        console.log(res);
      })
      .catch( err => {
        console.log(err);
      })
      this.snackBar.open('Registro exitoso', 'Cerrar', { duration: 3000 });
      this.route.navigate(['/login']);
      // Realiza alguna otra acción necesaria
    } else {
      this.snackBar.open('El formulario es inválido', 'Cerrar', { duration: 3000 });
    }
  }
 */
  matchConfirmPassword(control: FormControl) {
    const password:any = this.registerForm.controls['password'].value  || '';
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  
 
  onSubmit() {
    if (this.registerForm.invalid) {
      console.log('El formulario es inválido');
      return;
    }
   
    console.log('Registration attempt with:', {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword,
      terms: this.registerForm.value.terms,
    });
    // Here you would typically handle user registration
  }
  
  signUpWithGoogle() {
    console.log('Attempting to sign up with Google');
    // Here you would implement Google authentication
    // Typically using Firebase Authentication or another auth provider
  }
 

}
