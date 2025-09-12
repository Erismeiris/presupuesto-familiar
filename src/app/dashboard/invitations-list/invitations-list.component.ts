import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExpenseInvitationService } from '../../services/expense-invitation.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { ExpenseInvitation } from '../../interface/expense-invitation.interface';
import { Toast } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { TabViewModule } from 'primeng/tabview';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


import { TagModule } from 'primeng/tag';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HeaderComponent } from '../shared/header/header.component';


@Component({
  selector: 'app-invitations-list',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    TitleCasePipe,
    Toast,
    ReactiveFormsModule,
    TagModule,AvatarModule,TabViewModule,ButtonModule,ProgressSpinnerModule
  ],
  templateUrl: './invitations-list.component.html',
  styleUrl: './invitations-list.component.css'
})
export class InvitationsListComponent implements OnInit, OnDestroy{
private destroy$ = new Subject<void>();
  private invitationService = inject(ExpenseInvitationService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  currentUser: any;
  activeIndex = 0; // Para PrimeNG TabView
  
  sentInvitations$ = this.invitationService.sentInvitations$;
  receivedInvitations$ = this.invitationService.receivedInvitations$;
  loading$ = this.invitationService.loading$;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadInvitations();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadInvitations(): void {
    this.invitationService.loadSentInvitations(this.currentUser.uid);
    this.invitationService.loadReceivedInvitations(this.currentUser.uid);
  }

  respondToInvitation(invitation: ExpenseInvitation, response: 'accepted' | 'rejected'): void {
    const request = {
      invitationId: invitation.id,
      response: response,
      toUserId: this.currentUser.uid
    };

    this.invitationService.respondToInvitation(request).subscribe({
      next: (result) => {
        const message = response === 'accepted' 
          ? 'Invitación aceptada exitosamente. ¡Ahora puedes compartir gastos!'
          : 'Invitación rechazada';
        
        this.messageService.add({
          severity: response === 'accepted' ? 'success' : 'info',
          summary: response === 'accepted' ? 'Invitación Aceptada' : 'Invitación Rechazada',
          detail: message,
          life: 3000
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al responder la invitación',
          life: 3000
        });
      }
    });
  }
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'pi pi-clock';
      case 'accepted': return 'pi pi-check-circle';
      case 'rejected': return 'pi pi-times-circle';
      default: return 'pi pi-question-circle';
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'pending':
        return 'info';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
