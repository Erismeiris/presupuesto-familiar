import { Injectable, signal } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateCurrentUser,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, throwError, take, tap } from 'rxjs';
import { onAuthStateChanged } from '@angular/fire/auth';
import { docData } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

var baseURL = 'http://localhost:3000'
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //save user data
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();
  readonly user = signal<{ uid: string; email: string | null; name: string | null } | null>(null); 
  private apiUrl = `${baseURL}/api/auth/login`;  
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private http: HttpClient
  ) {
    // Inicializa el valor de la señal 'user' desde localStorage
    this.initializeUserFromStorage();
  }

  private initializeUserFromStorage() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        this.user.set(parsedUser);
        
        // Verificar si el token aún es válido
        const token = this.getAccessToken();
        console.log('Checking stored token:', token ? 'exists' : 'missing');
        
        if (!token) {
          console.log('No access token found, user needs to login again');
          this.clearUserSession();
          return;
        }
        
        if (this.isTokenExpired(token)) {
          console.log('Token expired, attempting refresh...');
          // Intentar refrescar el token
          this.refreshToken().subscribe({
            next: () => {
              console.log('Token refreshed successfully');
            },
            error: (error) => {
              console.error('Token refresh failed:', error);
              console.log('Redirecting to login...');
              this.clearUserSession();
              this.router.navigate(['/login']);
            }
          });
        } else {
          console.log('Token still valid');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearUserSession();
      }
    }
  }

  private clearUserSession() {
    this.user.set(null);
    this.accessTokenSubject.next(null);
    localStorage.removeItem('user');
  }

  async register(email: string, password: string, name: string) {
    return this.http.post(`${baseURL}/api/user`, { email, password, name }, { withCredentials: true });
  }

  loginUser(name: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { name, password }, { withCredentials: true }).pipe(
      tap((response: any) => {
        // Verificar que el login fue exitoso
        if (response && response.success && response.user) {
          const user = {
            uid: response.user.id.toString(), // Asegurar que sea string
            email: response.user.email || null,
            name: response.user.name || null
          };
          this.user.set(user);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Save access token - ahora siempre debería existir según la respuesta
          if (response.accessToken) {
            this.accessTokenSubject.next(response.accessToken);
          } else {
            console.warn('No access token received from backend');
          }
        } else {
          console.error('Login response missing required fields:', response);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }
 

  async logoutUser() {
    try {
      await signOut(this.auth);
      this.user.set(null);
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  refreshToken(): Observable<any> {
    console.log('Attempting to refresh token...');
    return this.http.post<any>(`${baseURL}/api/auth/refresh`, {}, 
      { withCredentials: true }
    ).pipe(
      tap(response => {
        console.log('Refresh token response:', response);
        if (response && response.accessToken) {
          this.accessTokenSubject.next(response.accessToken);
          console.log('Access token updated');
        } else {
          console.warn('No access token in refresh response');
        }
      }),
      catchError(error => {
        console.error('Refresh token error:', error.status, error.error);
        if (error.status === 401) {
          console.log('Refresh token invalid or expired, clearing session');
        }
        this.clearUserSession();
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${baseURL}/api/auth/logout`, {}, 
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.accessTokenSubject.next(null);
        this.user.set(null);
        localStorage.removeItem('user');
      }),
      catchError(error => {
        // Even if logout fails on backend, clear local state
        this.accessTokenSubject.next(null);
        this.user.set(null);
        localStorage.removeItem('user');
        return throwError(() => error);
      })
    );
  }

  registerUser(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${baseURL}/api/users/register`, { name, email, password }).pipe(
      tap((response: any) => {
        // Si el registro incluye login automático
        if (response && response.success && response.user) {
          const user = {
            uid: response.user.id.toString(), // Asegurar que sea string
            email: response.user.email || null,
            name: response.user.name || null
          };
          this.user.set(user);
          localStorage.setItem('user', JSON.stringify(user));
          
          if (response.accessToken) {
            this.accessTokenSubject.next(response.accessToken);
          }
        }
      }),
      catchError(error => {
        console.error('Register error:', error);
        return throwError(() => error);
      })
    );
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  isAuthenticated(): boolean {
    // Check if user exists in signal (for Firebase auth)
    const currentUser = this.user();
    if (currentUser) {
      return true;
    }
    
    // Check JWT token for backend auth
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired(token);
  }

  getCurrentUser(): { uid: string; email: string | null; name: string | null } | null {
    let currentUser = this.user();
    
    // Si no hay usuario en el signal, intentar desde localStorage
    if (!currentUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          this.user.set(currentUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          return null;
        }
      }
    }
    
    return currentUser;
  }
}
