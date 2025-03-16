import { Injectable } from '@angular/core';
import {  Firestore, collection, deleteDoc, doc, updateDoc, getDoc, setDoc, where, getDocs, query } from '@angular/fire/firestore';
import { Storage,getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

import { UserProfile } from '../interface/user.interface';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private defaultProfileImagePath = 'profile_images/user_profile.png'

  constructor(private firestore: Firestore, private storage: Storage) { }


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
 
  async getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
    const userProfileCollection = collection(this.firestore, 'user_profile');
    const userProfileQuery = query(userProfileCollection, where('userId', '==', userId));

    try {
      const querySnapshot = await getDocs(userProfileQuery);

      if (!querySnapshot.empty) {
        // Encontró un perfil de usuario
        const doc = querySnapshot.docs[0];
        const data = doc.data() as UserProfile; // Castea los datos al tipo UserProfile
        return data;
      } else {
        // No se encontró ningún perfil de usuario
        return null;
      }
    } catch (error) {
      console.error('Error al obtener el perfil de usuario:', error);
      return null;
    }
  }

  //Get default
  getDefaultProfileImageUrl(): Observable<string> {
    const storageRef = ref(this.storage, this.defaultProfileImagePath);
    return from(getDownloadURL(storageRef));
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

  async uploadImage(file: File, userId: string, userName: string): Promise<string> {
    const storage = getStorage();
    const fileName = `${userName}_${userId}`;
    const storageRef = ref(storage, `profile_images/${fileName}`);
    
    // Delete existing image if it exists
    try {
      await deleteObject(storageRef);
    } catch (error:any) {
      if (error.code !== 'storage/object-not-found') {
        throw error;
      }
    }

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }
}
