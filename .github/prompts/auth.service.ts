import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface LoginResponse {
  accessToken: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000'; // Adjust to your backend URL
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, 
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.setAccessToken(response.accessToken);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.API_URL}/refresh`, {}, 
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.setAccessToken(response.accessToken);
      }),
      catchError(error => {
        this.clearAccessToken();
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, {}, 
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.clearAccessToken();
      }),
      catchError(error => {
        this.clearAccessToken();
        return throwError(() => error);
      })
    );
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  private setAccessToken(token: string): void {
    this.accessTokenSubject.next(token);
  }

  private clearAccessToken(): void {
    this.accessTokenSubject.next(null);
  }
}
