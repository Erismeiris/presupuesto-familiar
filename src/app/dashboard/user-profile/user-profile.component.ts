import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../interface/user.interface';
import { ProfileService } from '../../services/profile.service';


import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from '../shared/header/header.component';


interface ColorPalette {
  name: string;
  primary: string;
  
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface UploadEvent {
  originalEvent: Event;
  files: File[];
}
@Component({
  selector: 'user-profile',
  standalone: true,
  imports: [
    HeaderComponent,
    CommonModule, 
    FormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    ToastModule, 
    ButtonModule, 
    FileUploadModule,
    HttpClientModule
        
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  
})
export class UserProfileComponent implements OnInit {
  public userProfile! : UserProfile 
  public user: { uid: string; email: string | null; name: string | null } | null = null;
  public photoUrl = '';
  public previewImageUrl = '';
  public selectedFile: File | null = null;
  public showPreview = false;
  public isLoading: boolean = true;
  public isUploadingImage: boolean = false;
  public isEditingName = false;
  public editedName = '';

  colorFavorite =  "#3498db"
   
  currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" }
  ];

  selectedPalette: ColorPalette | null = null;
  customColor!: string;
  selectedCurrency: string = "USD";
  isSharedExpenseEnabled: boolean = false;
  sharedEmails: string[] = [""] ;
  isCardVisible: boolean = false;

 

  public message='';


  public authService = inject(AuthService);
  public profileService = inject(ProfileService);
  public router = inject(Router);
  

  
  

  ngOnInit(): void {
    this.customColor = this.colorFavorite;
    this.selectedCurrency = "USD";   
  }
  
  constructor( ) {  
    this.getProfile();
  
   }

  

  selectTheme(palette: ColorPalette): void {
    this.selectedPalette = palette;
    document.documentElement.style.setProperty("--primary-color", palette.primary);
    console.log("Theme selected:", palette);
   
  }

  updateCustomTheme(): void {
    this.customColor = this.colorFavorite;
  }

  updateCurrency(): void {
    console.log("Currency updated to:", this.selectedCurrency);
  }
  toggleSharedExpense(): void {
    console.log("Shared expense toggled:", this.isSharedExpenseEnabled);
  }

  addNewEmail(): void {
    this.sharedEmails.push("");
  }

   removeEmail(index: number): void {
    if (this.sharedEmails.length > 1) {
      this.sharedEmails.splice(index, 1);
    }
  }
  // Capturar la imagen y mostrar preview
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Crear URL de preview para mostrar la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImageUrl = e.target.result;
        this.showPreview = true;
      };
      reader.readAsDataURL(file);
      
      console.log("File selected:", file.name);
    }
  }
  

  // Confirmar y subir la imagen
  async confirmImageUpload() {
    if (!this.selectedFile) return;
    
    const currentUser = this.authService.getCurrentUser();
    const userUid = currentUser?.uid;
    const username = currentUser?.name;
    
    if (userUid && this.userProfile?.id) {
      try {
        this.isUploadingImage = true;
        const userName = username || `user_${userUid}`;
        
        // Llamar al servicio de upload
        const imageUrl = await this.profileService.uploadImage(this.selectedFile, userUid, userName);
        
        // Verificar si se obtuvo una URL válida
        if (!imageUrl || imageUrl.trim() === '') {
          console.error("No image URL received from upload");
          console.error("Check the backend response structure in the console above");
          // Solo mostrar error en consola, no alert ya que puede ser un problema temporal
          return;
        }
        
        // Actualizar la imagen del perfil localmente
        this.photoUrl = imageUrl;
        
        // Actualizar el perfil en el backend con la nueva imagen
        const profileData = {
          name: this.user?.name || "",
          color: this.colorFavorite,
          currency: this.selectedCurrency,
          isSharingExpenses: this.isSharedExpenseEnabled,
          sharedWithUsers: this.sharedEmails.filter(email => email.trim() !== ""),
          emailVerified: this.userProfile.emailVerified || false,
          photoURL: imageUrl // Incluir la nueva URL de la imagen
        };

        const updatedProfile = await this.profileService.updateProfile(this.userProfile.id, profileData);
        
        // Actualizar el perfil local con los datos del backend
        if (updatedProfile) {
          this.userProfile = updatedProfile;
          this.photoUrl = updatedProfile.photoURL || imageUrl;
        }
        
        this.showPreview = false;
        this.selectedFile = null;
        this.previewImageUrl = '';
        
        console.log("Image uploaded and profile updated successfully");
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        this.isUploadingImage = false;
      }
    } else {
      console.error("User ID or Profile ID is undefined");
    }
  }

  // Cancelar la subida y volver a la imagen anterior
  cancelImageUpload() {
    this.showPreview = false;
    this.selectedFile = null;
    this.previewImageUrl = '';
    
    // Reset del input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Iniciar edición del nombre
  startEditingName() {
    this.isEditingName = true;
    this.editedName = this.user?.name || '';
  }

  // Guardar el nombre editado
  async saveNameEdit() {
    if (this.editedName.trim() && this.user && this.userProfile?.id) {
      try {
        // Actualizar el usuario local temporalmente
        this.user = { ...this.user, name: this.editedName.trim() };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.authService.user.set(this.user);
        
        // Guardar en el backend
        const profileData = {
          name: this.editedName.trim(),
          color: this.colorFavorite,
          currency: this.selectedCurrency,
          isSharingExpenses: this.isSharedExpenseEnabled,
          sharedWithUsers: this.sharedEmails.filter(email => email.trim() !== ""),
          emailVerified: this.userProfile.emailVerified || false,
          photoURL: this.photoUrl
        };

        const updatedProfile = await this.profileService.updateProfile(this.userProfile.id, profileData);
        
        if (updatedProfile) {
          // Actualizar el perfil local con la respuesta del backend
          this.userProfile = updatedProfile;
          console.log('Name updated successfully in backend:', this.editedName);
        } else {
          console.error('Failed to update name in backend');
        }
        
        this.isEditingName = false;
      } catch (error) {
        console.error('Error updating name:', error);
        // Revertir cambios locales si falla el backend
        this.user = { ...this.user, name: this.userProfile?.name || '' };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.authService.user.set(this.user);
      }
    }
  }

  // Cancelar edición del nombre
  cancelNameEdit() {
    this.isEditingName = false;
    this.editedName = '';
  }

 async saveSettings(): Promise<void> {
    if (!this.userProfile?.id) {
      console.error("No profile ID available for update");
      return;
    }

    try {
      this.isLoading = true;
      
      const profileData = {
        name: this.user?.name || "",
        color: this.colorFavorite,
        currency: this.selectedCurrency,
        isSharingExpenses: this.isSharedExpenseEnabled,
        sharedWithUsers: this.sharedEmails.filter(email => email.trim() !== ""),
        emailVerified: this.userProfile.emailVerified || false,
        photoURL: this.photoUrl // Incluir la URL de la imagen actual
      };

      const updatedProfile = await this.profileService.updateProfile(this.userProfile.id, profileData);
      
      if (updatedProfile) {
        console.log("Profile updated successfully:", updatedProfile);
        this.router.navigate(["/dashboard"]);
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      this.isLoading = false;
    }
  }
 



  async getProfile() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    // Obtener usuario actual
    this.user = this.authService.getCurrentUser();
    console.log('Current user:', this.user);
    
    const userUid = this.user?.uid;    
    if(userUid) {
      try {
        const profile = await this.profileService.getProfileByUserId(userUid);
        if (profile) {
          this.userProfile = profile; // Guardar el perfil completo
          this.colorFavorite = profile.color || "#3498db";
          this.selectedCurrency = profile.currency || "USD";
          this.isSharedExpenseEnabled = profile.isSharingExpenses || false;
          this.sharedEmails = profile.sharedWithUsers || [""];
          this.photoUrl = profile.photoURL || '';
          console.log('Profile loaded successfully');
        } else {
          console.log("No profile found, using defaults");
        }
      } catch (error: any) {
        console.error("Error loading profile:", error);
        // Si hay error de autenticación, redirigir al login
        if (error?.status === 401) {
          this.router.navigate(['/login']);
        }
      } finally {
        this.isLoading = false; // Importante: terminar el loading cuando se complete la carga
      }
    } else {
      console.error("No user UID available");
      this.router.navigate(['/login']);
    }
  }

  onImageError(event: any) {
    console.error("Error loading image:", event);
    console.log("Failed image src:", event.target.src);
    console.log("Current photoUrl:", this.photoUrl);
  }

  showCard(): void {
    this.isCardVisible = true;
  }

  hideCard(): void {
    this.isCardVisible = false;
  }
}
