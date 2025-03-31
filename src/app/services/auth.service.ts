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
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //save user data
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();
  readonly user = signal<{ uid: string; email: string | null; name: string | null } | null>(null); 

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    // Inicializa el valor de la señal 'user' desde localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user.set(JSON.parse(storedUser));
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

  async loginUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      if (userCredential.user) {
        const userDoc = doc(this.firestore, 'usuarios', userCredential.user.uid);
        const userData = await docData(userDoc).pipe(take(1)).toPromise(); // Espera a que se obtengan los datos
        const user = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData?.['name'] || null // Usa el campo 'name' de la colección 'usuarios'
        };

        this.user.set(user); // Actualiza el valor de la señal
        localStorage.setItem('user', JSON.stringify(user)); // Persistencia opcional
      }
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }
 

  async logoutUser() {
    try {
      await signOut(this.auth);
      onAuthStateChanged(this.auth, (user) => {
        if (!user) {
          this.userSubject.next(null);
          this.user.set(null); // Actualiza el valor de la señal
          this.router.navigate(['/login']);
        }
      });
    } catch (error) {
      throw error;
    }
  }
}
