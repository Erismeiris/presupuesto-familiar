import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, UserProfile } from '../../interface/user.interface';
import { ProfileService } from '../../services/profile.service';


import { HttpClientModule } from '@angular/common/http';


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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  public userProfile! : UserProfile 
  public photoUrl = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7';
  public isLoading!: boolean;

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
  sharedEmails: string[] = [""];
  isCardVisible: boolean = false;
  public userlogged: User = { uid: '', email: '', name: '' };
  public message='';


  public authSerivice = inject(AuthService);
  

  
  

  ngOnInit(): void {
    this.loadUserLogged();
    this.loadSavedSettings(); 
    this.customColor = this.colorFavorite;
    this.selectedCurrency = "USD";   
  }
  
  constructor(private profileSerivice: ProfileService ) {
   
   }

    loadUserLogged() {     
     this.authSerivice.getUserLogged().subscribe((user) => {      
      if (user) {
        this.userlogged = {uid: user.uid, email: user.email, name: user.name};
        this.isLoading = false; 
      } else {
        this.isLoading = true;
      }
    });
  }

   loadSavedSettings(): void {
    const savedSettings = localStorage.getItem("profileSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.selectedPalette = settings.palette;
      this.customColor = settings.customColor;
      this.selectedCurrency = settings.currency;
      this.isSharedExpenseEnabled = settings.sharedExpense;
      this.sharedEmails = settings.sharedEmails || [""];
    }
  } 

  selectTheme(palette: ColorPalette): void {
    this.selectedPalette = palette;
    document.documentElement.style.setProperty("--primary-color", palette.primary);
    console.log("Theme selected:", palette);
   
  }

  updateCustomTheme(): void {
    this.colorFavorite = this.customColor;
    
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
  //Capturar la imagen y convertirla en base64, enviarla al servicios de firebase
  async onUpload(event: any) {
    const file = event.target.files[0];    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {      
      if (this.userlogged.uid && this.userlogged.name) {
        this.profileSerivice.uploadImage(file, this.userlogged.uid, this.userlogged.name).then((url) => {
          this.photoUrl = url;
        });
      } else {
        console.error("User ID or name is undefined");
      }
    }
     
  }

  async saveSettings(): Promise<void> {
     const userProfile:UserProfile = {
      userId: this.userlogged.uid,
      name: this.userlogged.name,
      color: this.customColor,
      currency: this.selectedCurrency,
      photoURL: this.userProfile?.photoURL?.toString() || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7',
      sharedExpense: this.isSharedExpenseEnabled,
      emailShared: this.sharedEmails
    };

    try {
      await this.profileSerivice.addProfile(userProfile);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  showCard(): void {
    this.isCardVisible = true;
  }

  hideCard(): void {
    this.isCardVisible = false;
  }
}
