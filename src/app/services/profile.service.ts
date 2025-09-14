import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UserProfile } from '../interface/user.interface';
import { BehaviorSubject, from, map, Observable, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private userprofileURL = `http://localhost:3000/api/userprofiles/user/${'userId'}`;
  private defaultProfileImagePath = 'profile_images/user_profile.png';
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();
  private cachedProfile: UserProfile | null = null; // Cached profile

  constructor(private http: HttpClient) {}

  // Método para obtener el perfil del usuario por UID
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    // Si hay un perfil en caché y es del mismo usuario, devolverlo
    if (this.cachedProfile && this.cachedProfile.userId === userId) {
      return this.cachedProfile;
    }        
    
    try {
      // Construir la URL con el userId
      const url = this.userprofileURL.replace('userId', userId);
      
      // Hacer la petición HTTP al backend
      const profile = await this.http.get<UserProfile>(url).pipe(
        catchError(error => {
          console.error('Error fetching profile:', error);
          return of(null);
        })
      ).toPromise();

      if (profile) {
        this.cachedProfile = profile;
        return profile;
      } 
    } catch (error) {
      console.error('Error in getProfileByUserId:', error);
    }
    
    // Return null if no profile is found or an error occurs
    return null;
  }

  // Método para subir la imagen del perfil
  async uploadImage(
    file: File,
    userId: string,
    userName: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const url = `http://localhost:3000/api/userprofiles/${userId}/upload-image`;
      const response = await this.http.post<any>(url, formData).toPromise();
      
      // Extraer la URL de la imagen de la respuesta del backend
      // El backend devuelve: { message: '...', profile: {...}, photoURL: 'url' }
      const imageUrl = response?.photoURL || '';
      
      console.log('ProfileService: Extracted imageUrl:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('ProfileService: Error uploading image:', error);
      throw error;
    }
  }

  // Método para actualizar el perfil del usuario
  async updateProfile(
    profileId: string,
    profileData: {
      name?: string;
      color?: string;
      isSharingExpenses?: boolean;
      sharedWithUsers?: string[];
      currency?: string;
      emailVerified?: boolean;
      photoURL?: string;
    }
  ): Promise<UserProfile | null> {
    try {
      const response = await this.http.put<UserProfile>(
        `http://localhost:3000/api/userprofiles/${profileId}`, 
        profileData
      ).toPromise();

      if (response) {
        // Actualizar el caché con el perfil actualizado
        this.cachedProfile = response;
        this.profileSubject.next(response);
        console.log('Profile updated successfully:', response);
        console.log('Updated profile photoURL:', response.photoURL);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

}