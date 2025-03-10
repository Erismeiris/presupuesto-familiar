import { Injectable } from '@angular/core';
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
import { tap } from 'rxjs';
import { onAuthStateChanged } from '@angular/fire/auth';
import { docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userProfileByDefault = {
    currency: 'EUR',
    customColor: '#0042aa',
    sharedEmails: [''],
    useName: '',
    haredExpense: false,
    userId: '',
  };

  //save user data
  public user: User[] = [];

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

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
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async logoutUser() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      throw error;
    }
  }

  getUserLogged(): Observable<any> {
    return new Observable((observer) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          const userDoc = doc(this.firestore, 'usuarios', user.uid);
          docData(userDoc).subscribe((userData) => {
            observer.next({ ...user, ...userData });
          });
        } else {
          observer.next(null);
        }
      });
    });
  }
}
