import { Injectable, signal } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateCurrentUser,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, take, tap } from 'rxjs';
import { onAuthStateChanged } from '@angular/fire/auth';
import { docData } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
  

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

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private http: HttpClient
  ) {
    // Inicializa el valor de la señal 'user' desde localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.user.set(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }

    // Escucha los cambios en el estado de autenticación
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = doc(this.firestore, 'usuarios', firebaseUser.uid);
        const userData = await docData(userDoc).pipe(take(1)).toPromise();
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.['name'] || null
        };
        this.user.set(user);
        localStorage.setItem('user', JSON.stringify(user)); // Actualiza localStorage
      } else {
        this.user.set(null);
        localStorage.removeItem('user'); // Limpia localStorage
      }
    });
  }

  async register(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      if (userCredential.user) {
        const userDoc = doc(
          this.firestore,
          'usuarios',
          userCredential.user.uid
        );
        await setDoc(userDoc, { name: name, email: email });
        return userCredential.user;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  loginUser(name: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { name, password }).pipe(
      tap((response: any) => {
        if (response && response.user) {
          const user = {
            uid: response.user.id || response.user.uid,
            email: response.user.email,
            name: response.user.name
          };
          this.user.set(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
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
}
