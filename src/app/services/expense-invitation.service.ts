import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { 
  ExpenseInvitation, 
  SendInvitationRequest, 
  SendInvitationResponse,
  RespondInvitationRequest,
  RespondInvitationResponse,
  InvitationsListResponse
} from '../interface/expense-invitation.interface';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExpenseInvitationService {
private readonly API_URL = `${environment.apiUrl}/api/expense-invitations`;
// Subjects para estado reactivo
  private sentInvitationsSubject = new BehaviorSubject<ExpenseInvitation[]>([]);
  private receivedInvitationsSubject = new BehaviorSubject<ExpenseInvitation[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  // Observables públicos
  public sentInvitations$ = this.sentInvitationsSubject.asObservable();
  public receivedInvitations$ = this.receivedInvitationsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

   /**
   * Obtener headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken(); // Adaptar según tu AuthService
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
/**
   * Responder a una invitación
   */
  respondToInvitation(request: RespondInvitationRequest): Observable<RespondInvitationResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<RespondInvitationResponse>(
      `${this.API_URL}/respond`,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Recargar invitaciones recibidas después de responder
        this.loadReceivedInvitations(request.toUserId);
      }),
      catchError(error => {
        console.error('Error al responder invitación:', error);
        throw error;
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Enviar invitación para compartir gastos
   */
  sendInvitation(request: SendInvitationRequest): Observable<SendInvitationResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<SendInvitationResponse>(
      `${this.API_URL}/invite`, 
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Recargar invitaciones enviadas después de enviar una nueva
        this.loadSentInvitations(request.fromUserId);
      }),
      catchError(error => {
        console.error('Error al enviar invitación:', error);
        throw error;
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Cargar y actualizar invitaciones enviadas en el estado
   */
  loadSentInvitations(userId: string): void {
    this.getSentInvitations(userId).subscribe({
      next: (response) => {
        this.sentInvitationsSubject.next(response.invitations);
      },
      error: (error) => {
        console.error('Error al cargar invitaciones enviadas:', error);
        this.sentInvitationsSubject.next([]);
      }
    });
  }

  /**
   * Obtener invitaciones enviadas por el usuario
   */
  getSentInvitations(userId: string): Observable<InvitationsListResponse> {
    return this.http.get<InvitationsListResponse>(
      `${this.API_URL}/sent/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener invitaciones recibidas por el usuario
   */
  getReceivedInvitations(userId: string): Observable<InvitationsListResponse> {
    return this.http.get<InvitationsListResponse>(
      `${this.API_URL}/received/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Cargar y actualizar invitaciones recibidas en el estado
   */
  loadReceivedInvitations(userId: string): void {
    this.getReceivedInvitations(userId).subscribe({
      next: (response) => {
        this.receivedInvitationsSubject.next(response.invitations);
      },
      error: (error) => {
        console.error('Error al cargar invitaciones recibidas:', error);
        this.receivedInvitationsSubject.next([]);
      }
    });
  }

  /**
   * Obtener conteo de invitaciones pendientes
   */
  getPendingInvitationsCount(): Observable<number> {
    return this.receivedInvitations$.pipe(
      map(invitations => invitations.filter(inv => inv.status === 'pending').length)
    );
  }

  /**
   * Limpiar estado del servicio
   */
  clearState(): void {
    this.sentInvitationsSubject.next([]);
    this.receivedInvitationsSubject.next([]);
    this.loadingSubject.next(false);
  }

}
