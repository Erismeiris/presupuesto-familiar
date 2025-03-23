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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    this.authSerivice.getUser().subscribe(userlogged => {
      const { uid, email, name } = userlogged;
      this.user = { uid, email, name };
     
    }); 
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
      if (this.user?.uid && this.user?.name) {
        this.profileSerivice.uploadImage(file, this.user.uid, this.user.name).then((url) => {
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
    if(this.user)
   
   await this.profileSerivice.getUserProfileByUserId(this.user.uid).then((profile) => {
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
