import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ExpenseInvitationService } from '../../services/expense-invitation.service';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { AsyncPipe } from '@angular/common';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-send-invitation-component',
  standalone: true,
  imports: [ButtonModule, AsyncPipe,ReactiveFormsModule,Toast],
  templateUrl: './send-invitation-component.html',
  styleUrl: './send-invitation-component.css'
  
})
export class SendInvitationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invitationService = inject(ExpenseInvitationService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  invitationForm: FormGroup;
  loading$ = this.invitationService.loading$;
  currentUser: any; // Adaptar según tu interfaz de usuario

  constructor() {
    this.invitationForm = this.fb.group({
      toUserEmail: ['', [Validators.required, Validators.email]]
    });
  }
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser(); // Adaptar según tu AuthService
  }

  onSubmit(): void {
    if (this.invitationForm.valid && this.currentUser) {
      const request = {
        fromUserId: this.currentUser.uid,
        toUserEmail: this.invitationForm.get('toUserEmail')?.value
      };

      this.invitationService.sendInvitation(request).subscribe({
        next: (response) => {
          const message = response.invitation.userExists 
            ? `Invitación enviada a ${response.invitation.toUserEmail}. El usuario recibirá un correo para aceptar la invitación.`
            : `Invitación enviada a ${response.invitation.toUserEmail}. Se envió un correo para que se registre y acepte la invitación.`;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Invitación enviada',
            detail: message,
            life: 5000
          });
          
          this.invitationForm.reset();
        },
        error: (error) => {
          let errorMessage = 'Error al enviar la invitación';
          
          if (error.status === 409) {
            errorMessage = 'Ya existe una invitación pendiente para este usuario';
          } else if (error.status === 404) {
            errorMessage = 'Usuario no encontrado';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
          });
        }
      });
    }
  }

}
