import { Injectable } from '@angular/core';
import { collectionData, Firestore, collection, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, where, getDocs, query } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { map } from 'rxjs';
import { UserProfile } from '../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private firestore: Firestore, private authServices: AuthService) { }
  // Método para obtener el perfil del usuario por UID
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    const profilesRef = collection(this.firestore, 'user_profile');
    const q = query(profilesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserProfile;
    }
    return null;
  }

  async addProfile(profile: UserProfile): Promise<void> {
    const userId = profile.userId;
    const existingProfile = await this.getProfileByUserId(userId);

    if (existingProfile) {
      // Actualizar el perfil existente
      const profileRef = doc(this.firestore, `user_profile/${existingProfile.id}`);
      await updateDoc(profileRef, profile as any);
    } else {
      // Crear un nuevo perfil
      const newProfile = doc(collection(this.firestore, 'user_profile'));
      await setDoc(newProfile, profile);
    }
  }

  //Get profile using firestore by uid
   /* getProfile(){
    const newProfile = collection(this.firestore, 'user_profile');
    return collectionData(newProfile, {idField: 'id'}).pipe(
      map((data: any) => data.filter((profile: any) => profile.uid === this.authServices.getUserLogged()?.uid))
    )
  } */

  deleteProfile(profile: any){
    const profileRef = doc(this.firestore, `user_profile/${profile.id}`)
    return deleteDoc(profileRef);
  }

  //Update profile using firestore
  updateData(documentId: string, newData: any): Promise<void> {
    const profileRef = doc(this.firestore, `user_profile/${documentId}`)
    return updateDoc(profileRef, newData)
  }
}
