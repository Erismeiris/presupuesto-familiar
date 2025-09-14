import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of, delay } from 'rxjs';
import { UserSearchResult } from '../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserSearchService {
private readonly API_URL = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) { }

  /**
   * Buscar usuario por email
   * Este método verifica si un usuario existe
   */
  searchUserByEmail(email: string): Observable<UserSearchResult> {
    if (!email || !this.isValidEmail(email)) {
      return of({ exists: false });
    }

    // Opción 1: Usar endpoint específico de búsqueda (recomendado)
    return this.http.get<any>(`${this.API_URL}/search?email=${encodeURIComponent(email)}`).pipe(
      map(response => ({
        exists: !!response.user,
        user: response.user ? {
          uid: response.user.uid,
          email: response.user.email,
          name: response.user.name
        } : undefined
      })),
      catchError(error => {
        console.error('Error searching user:', error);
        return of({ exists: false });
      })
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Verificar múltiples emails a la vez
   */
  searchMultipleUsers(emails: string[]): Observable<{ [email: string]: UserSearchResult }> {
    const validEmails = emails.filter(email => this.isValidEmail(email));
    
    if (validEmails.length === 0) {
      return of({});
    }

    return this.http.post<any>(`${this.API_URL}/search-multiple`, { emails: validEmails }).pipe(
      map(response => response.results || {}),
      catchError(error => {
        console.error('Error searching multiple users:', error);
        return of({});
      })
    );
  }
}
