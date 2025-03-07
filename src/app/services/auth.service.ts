import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Auth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateCurrentUser } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { tap } from 'rxjs';

@Injectable({
    providedIn:'root'
})
export class AuthService {

    //save user data
    public user: User[] = [];

    constructor( private auth: Auth, private firestore: Firestore,private router: Router) { }

   async register(email: string, password: string, name: string) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            if (userCredential.user) {
                const userDoc = doc(this.firestore, 'usuarios', userCredential.user.uid);
                await setDoc(userDoc, { name: name, email: email });
                return userCredential.user;
            } 
            return null;
          } catch (error) {
            console.error('Error al registrar usuario:', error);
            throw error; // Lanza el error para que el componente lo maneje
          }
        
    }

    async loginUser(email: string, password: string) {
        try {
          const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
          return userCredential.user;
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          throw error;
        }
      }
    
      async logoutUser() {
        try {
          await signOut(this.auth);
          this.router.navigate(['/login']);
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
          throw error;
        }
      }
}



