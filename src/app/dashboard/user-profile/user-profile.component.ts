import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailValidationState, UserProfile } from '../../interface/user.interface';
import { ProfileService } from '../../services/profile.service';


import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from '../shared/header/header.component';
import { debounceTime, from, of, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpenseInvitationService } from '../../services/expense-invitation.service';
import { UserSearchService } from '../../services/user-search.service';
import { ExpenseInvitation, SendInvitationRequest } from '../../interface/expense-invitation.interface';


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
  public emailStates: EmailValidationState[] = []; // Inicializar vacío
  public expensesInvitation: ExpenseInvitationService = inject(ExpenseInvitationService);
  
  sharedEmails: string[] = [""] ;
  isCardVisible: boolean = false;



  public message='';

  private emailSearchSubject = new Subject<{ email: string; index: number }>();

  public authService = inject(AuthService);
  public userSearchService = inject(UserSearchService);
  public profileService = inject(ProfileService);
  public router = inject(Router);
  public invitationService = inject(ExpenseInvitationService);

  
  

  constructor() {
    this.getProfile();
    this.setupEmailSearch(); // Mover aquí desde ngOnInit
  }

  ngOnInit(): void {
    this.customColor = this.colorFavorite;
    this.selectedCurrency = "USD"; 
    // Remover setupEmailSearch() de aquí
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
    
    if (this.isSharedExpenseEnabled) {
      // Cuando se activa, inicializar con un email vacío
      this.emailStates = [{
        email: '',
        isValidating: false,
        userExists: null,
        canSendInvitation: false,
        validationMessage: ''
      }];
    } else {
      // Cuando se desactiva, limpiar completamente
      this.emailStates = [];
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
          sharedWithUsers: this.getValidEmails(),
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
          sharedWithUsers: this.getValidEmails(),
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
        sharedWithUsers: this.getValidEmails(),
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
          this.userProfile = profile;
          this.colorFavorite = profile.color || "#3498db";
          this.selectedCurrency = profile.currency || "USD";
          this.isSharedExpenseEnabled = profile.isSharingExpenses || false;
          
          // Solo cargar emails si está habilitado el gasto compartido
          if (this.isSharedExpenseEnabled && profile.sharedWithUsers && profile.sharedWithUsers.length > 0) {
            this.emailStates = profile.sharedWithUsers.map(email => ({
              email: email,
              isValidating: false,
              userExists: null,
              canSendInvitation: false,
              validationMessage: ''
            }));
          } else if (this.isSharedExpenseEnabled) {
            // Si está habilitado pero no hay emails guardados, inicializar con uno vacío
            this.emailStates = [{
              email: '',
              isValidating: false,
              userExists: null,
              canSendInvitation: false,
              validationMessage: ''
            }];
          }
          // Si no está habilitado, emailStates permanece vacío
          
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

  // ✨ Configurar búsqueda reactiva con debounce
  private setupEmailSearch(): void {
    this.emailSearchSubject.pipe(
      debounceTime(500), // Esperar 500ms después de que el usuario pare de escribir
      switchMap(({ email, index }) => {
        if (!email || !this.isValidEmail(email)) {
          return of({ index, result: null });
        }
        
        this.emailStates[index].isValidating = true;
        this.emailStates[index].validationMessage = 'Buscando usuario...';
        
        // ✨ Aquí usarías tu servicio real para buscar usuarios
        return from(this.searchUserByEmail(email)).pipe(
          switchMap(userExists => of({ index, result: { userExists, email } }))
        );
      }),
      takeUntilDestroyed() // Ahora funciona porque está en el constructor
    ).subscribe(({ index, result }) => {
      if (result) {
        this.updateEmailValidationState(index, result.email, result.userExists || false);
      } else {
        this.emailStates[index].isValidating = false;
        this.emailStates[index].userExists = null;
        this.emailStates[index].canSendInvitation = false;
        this.emailStates[index].validationMessage = '';
      }
    });
  }
  // ✨ NUEVO: Validar formato de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
   // ✨ Búsqueda de usuario (reemplazar con tu servicio real)
  private searchUserByEmail(email: string) {
   
    return this.userSearchService.searchUserByEmail(email).toPromise()
    .then(res => res?.exists).catch(() => false);
  }

   // ✨ NUEVO: Actualizar estado de validación del email
  private updateEmailValidationState(index: number, email: string, userExists: boolean): void {
    const state = this.emailStates[index];
    state.isValidating = false;
    state.userExists = userExists;
    state.canSendInvitation = userExists;
    
    if (userExists) {
      state.validationMessage = '✅ Usuario encontrado - Listo para invitar';
      state.userName = `Usuario de ${email}`; // Aquí pondrías el nombre real del usuario
    } else {
      state.validationMessage = '⚠️ Usuario no registrado - Se enviará invitación de registro';
      state.canSendInvitation = true; // También podemos invitar a usuarios nuevos
    }
  }

  onEmailChange(email: string, index: number): void {
    this.emailStates[index].email = email;
    
    if (!email.trim()) {
      this.emailStates[index].userExists = null;
      this.emailStates[index].canSendInvitation = false;
      this.emailStates[index].validationMessage = '';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.emailStates[index].validationMessage = '❌ Formato de email inválido';
      this.emailStates[index].canSendInvitation = false;
      return;
    }

    // Verificar que no sea el email del usuario actual
    if (email === this.user?.email) {
      this.emailStates[index].validationMessage = '❌ No puedes invitarte a ti mismo';
      this.emailStates[index].canSendInvitation = false;
      return;
    }

    // Verificar emails duplicados
    const duplicateIndex = this.emailStates.findIndex((state, i) => 
      i !== index && state.email.toLowerCase() === email.toLowerCase()
    );
    
    if (duplicateIndex !== -1) {
      this.emailStates[index].validationMessage = '❌ Email ya agregado';
      this.emailStates[index].canSendInvitation = false;
      return;
    }

    // Buscar usuario
    this.emailSearchSubject.next({ email, index });
  }

  // ✨ NUEVO: Enviar invitación a un usuario específico
  async sendInvitation(index: number): Promise<void> {
    const emailState = this.emailStates[index];
    
    if (!emailState.canSendInvitation || !this.user?.uid) {
      return;
    }

    try {
      emailState.isValidating = true;
      emailState.validationMessage = 'Enviando invitación...';

      // Usar el servicio de invitaciones que ya implementaste
      const result = await this.invitationService.sendInvitation({
        fromUserId: this.user.uid,
        toUserEmail: emailState.email
      }).toPromise();

      if (result) {
        emailState.validationMessage = '✅ Invitación enviada exitosamente';
        emailState.canSendInvitation = false; // Desactivar botón después de enviar
        
        // Mostrar mensaje de éxito
        console.log(`Invitación enviada a ${emailState.email}:`, result);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      emailState.validationMessage = '❌ Error al enviar invitación';
    } finally {
      emailState.isValidating = false;
    }
  }

   // ✨ MODIFICADO: Agregar nuevo email
  addNewEmail(): void {
    this.emailStates.push({
      email: '',
      isValidating: false,
      userExists: null,
      canSendInvitation: false,
      validationMessage: ''
    });
  }

  // ✨ MODIFICADO: Remover email
  removeEmail(index: number): void {
    if (this.emailStates.length > 1) {
      this.emailStates.splice(index, 1);
    }
  }

   // ✨ MODIFICADO: Obtener lista de emails válidos para guardar
  private getValidEmails(): string[] {
    return this.emailStates
      .map(state => state.email.trim())
      .filter(email => email && this.isValidEmail(email));
  }

  // Métodos getter para el template
  get registeredUsersCount(): number {
    return this.emailStates.filter(e => e.userExists === true).length;
  }

  get newUsersCount(): number {
    return this.emailStates.filter(e => e.userExists === false).length;
  }

  get readyToInviteCount(): number {
    return this.emailStates.filter(e => e.canSendInvitation).length;
  }

  get shouldShowSummary(): boolean {
    return this.emailStates.length > 1;
  }

}
