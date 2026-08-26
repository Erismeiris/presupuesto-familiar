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
import { BehaviorSubject, firstValueFrom, Observable, throwError, take, tap } from 'rxjs';
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

  /**
   * Recupera de `localStorage` quién es el usuario. Es solo su identidad, no la
   * prueba de que la sesión siga viva: eso lo dice el access token.
   *
   * El access token vive únicamente en memoria, así que al arrancar la página
   * nunca hay ninguno. Antes esa ausencia se interpretaba como sesión perdida y
   * se borraba el usuario guardado, de modo que cada recarga te dejaba fuera.
   * Ahora no se borra nada: el guard y el interceptor renuevan con la cookie de
   * refresh en la primera petición, y si esa cookie ya no vale, el interceptor
   * propaga el 401 y la sesión se limpia entonces.
   */
  private initializeUserFromStorage() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      this.user.set(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error parsing stored user:', error);
      this.clearUserSession();
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
    console.log('LoginUser called with:', { name });
    return this.http.post(this.apiUrl, { name, password }, { withCredentials: true }).pipe(
      tap((response: any) => {
        console.log('Login response received:', response);
        // Verificar que el login fue exitoso
        if (response && response.success && response.user) {
          const user = {
            uid: response.user.id.toString(), // Asegurar que sea string
            email: response.user.email || null,
            name: response.user.name || null
          };
          console.log('Setting user signal:', user);
          this.user.set(user);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Save access token - ahora siempre debería existir según la respuesta
          if (response.accessToken) {
            console.log('Setting access token');
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
 

  /**
   * Cierra la sesión de verdad: invalida el refresh token en el servidor y
   * limpia el estado local. Antes solo hacía signOut de Firebase, que aquí no
   * autentica a nadie, así que la cookie de refresh seguía siendo válida y la
   * sesión se podía recuperar con /api/auth/refresh.
   */
  async logoutUser(): Promise<void> {
    try {
      await firstValueFrom(this.logout());
    } catch (error) {
      // logout() ya ha limpiado el estado local en el catchError, así que
      // aunque el servidor no responda se sale de la sesión en el navegador.
      console.error('Error al cerrar sesión en el servidor:', error);
    }

    this.router.navigate(['/login']);
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

        // El endpoint devuelve también el usuario, así que se aprovecha para
        // rehacer la identidad: cubre el caso de cookie válida sin nada en
        // localStorage, por ejemplo tras limpiar el almacenamiento del navegador.
        if (response && response.user && response.user.id != null) {
          const user = {
            uid: response.user.id.toString(),
            email: response.user.email || null,
            name: response.user.name || null
          };
          this.user.set(user);
          localStorage.setItem('user', JSON.stringify(user));
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
      tap(() => this.clearUserSession()),
      catchError(error => {
        // Even if logout fails on backend, clear local state
        this.clearUserSession();
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

  /**
   * Hay sesión solo si tenemos un access token vigente.
   *
   * Antes bastaba con que existiera el usuario en `localStorage`, que sobrevive
   * a la caducidad del token: el guard daba paso con sesiones ya muertas y el
   * fallo aparecía después, en la primera petición al servidor.
   *
   * Al recargar la página no hay token en memoria (solo la cookie de refresh),
   * así que aquí se responde `false` a propósito: el guard y el interceptor
   * renuevan contra /api/auth/refresh y vuelven a preguntar.
   */
  isAuthenticated(): boolean {
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
