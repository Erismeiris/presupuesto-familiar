import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  where,
  getDocs,
  query,
} from '@angular/fire/firestore';
import {
  Storage,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';

import { UserProfile } from '../interface/user.interface';
import { BehaviorSubject, from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private defaultProfileImagePath = 'profile_images/user_profile.png';
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();
  private cachedProfile: UserProfile | null = null; // Cached profile

  constructor(private firestore: Firestore, private storage: Storage) {}

  // Método para obtener el perfil del usuario por UID
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    if (this.cachedProfile && this.cachedProfile.userId === userId) {
      return this.cachedProfile;
    }
    const profilesRef = collection(this.firestore, 'user_profile');
    const q = query(profilesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const profile = { id: doc.id, ...doc.data() } as UserProfile;
      this.cachedProfile = profile; // Cache the profile
      return profile;
    }
    return null;
  }

  async addProfile(profile: UserProfile): Promise<void> {
    const userId = profile.userId;
    const existingProfile = await this.getProfileByUserId(userId);

    if (existingProfile) {
      // Actualizar el perfil existente
      const profileRef = doc(
        this.firestore,
        `user_profile/${existingProfile.id}`
      );
      await updateDoc(profileRef, profile as any);
    } else {
      // Crear un nuevo perfil
      const newProfile = doc(collection(this.firestore, 'user_profile'));
      await setDoc(newProfile, profile);
    }
    this.cachedProfile = profile; // Update the cached profile
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

  deleteProfile(profile: any) {
    const profileRef = doc(this.firestore, `user_profile/${profile.id}`);
    return deleteDoc(profileRef).then(() => {
      this.cachedProfile = null; // Clear the cached profile
    });
  }

  //Update profile using firestore
  updateData(documentId: string, newData: any): Promise<void> {
    const profileRef = doc(this.firestore, `user_profile/${documentId}`);
    return updateDoc(profileRef, newData);
  }

  async uploadImage(
    file: File,
    userId: string,
    userName: string
  ): Promise<string> {
    const storage = getStorage();
    const fileName = `${userName}_${userId}`;
    const storageRef = ref(storage, `profile_images/${fileName}`);

    // Delete existing image if it exists
    try {
      await deleteObject(storageRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        throw error;
      }
    }

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  async loadUserProfile(userId: string): Promise<void> {
    const profile = await this.getProfileByUserId(userId);
    this.profileSubject.next(profile);
  }
}
