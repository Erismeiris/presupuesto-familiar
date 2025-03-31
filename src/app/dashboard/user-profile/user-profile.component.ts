import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, UserProfile } from '../../interface/user.interface';
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
  public user!: User | null;
  public photoUrl = '';
  public isLoading: boolean = true;

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


  public authSerivice = inject(AuthService);
  public profileSerivice = inject(ProfileService);
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
  //Capturar la imagen y convertirla en base64, enviarla al servicios de firebase
  async onUpload(event: any) {
    const file = event.target.files[0];    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {  
      const userUid = this.authSerivice.user()?.uid;
      const username = this.authSerivice.user()?.name ;    
      if (userUid && username) {
        this.profileSerivice.uploadImage(file, userUid, username).then((url) => {
          this.photoUrl = url;
        });
      } else {
        console.error("User ID or name is undefined");
      }
    }
     
  }

  async saveSettings(): Promise<void> {
     const userProfile:UserProfile = {
      userId: this.user?.uid || "",
      name: this.user?.name || "",
      color: this.customColor,
      currency: this.selectedCurrency,
      photoURL: this.photoUrl,
      sharedExpense: this.isSharedExpenseEnabled,
      emailShared: this.sharedEmails
    };

    try {
      await this.profileSerivice.addProfile(userProfile).then(() => {
       this.router.navigate(["/dashboard"]);
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }
 

  getDefaultProfileImageUrl(): string {
    let defaultUrl = '';
    this.profileSerivice.getDefaultProfileImageUrl().subscribe((url) => {
      defaultUrl = url;
    });
    return defaultUrl;
  }

  async getProfile() {
    const userUid = this.authSerivice.user()?.uid;    
    if(userUid)   
   await this.profileSerivice.getProfileByUserId(userUid).then((profile) => {
      if (profile) {
        this.colorFavorite = profile.color;
        this.selectedCurrency = profile.currency;
        this.isSharedExpenseEnabled = profile.sharedExpense;
        this.sharedEmails = profile.emailShared || [];
        this.photoUrl = profile.photoURL || this.getDefaultProfileImageUrl();
      } else {
        console.error("Profile not found");
      }
   
  });
   
  
  }

  showCard(): void {
    this.isCardVisible = true;
  }

  hideCard(): void {
    this.isCardVisible = false;
  }
}
