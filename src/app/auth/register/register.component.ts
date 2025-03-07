import { CommonModule } from '@angular/common';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [
    // Import the Angular Material module
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule, 
    RouterModule
  ],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  registerForm!: FormGroup
  fb = inject(FormBuilder)

  messageError = '';

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
 
 
  constructor(private authService: AuthService, private router: Router) {}

  
  matchConfirmPassword(control: FormControl) {
    const password:any = this.registerForm.controls['password'].value  || '';
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  
 
 async onSubmit() {
  if (this.registerForm.valid) {
    const { email, password, name } = this.registerForm.value;

    try {
      await this.authService.register(email, password, name);
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.messageError = error.message;
    }
  }
    }
  
  
  signUpWithGoogle() {
    console.log('Attempting to sign up with Google');
    // Here you would implement Google authentication
    // Typically using Firebase Authentication or another auth provider
  }
 

}
