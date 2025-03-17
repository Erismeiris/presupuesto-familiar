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

  public userlogged: User = { uid: '', email: '', name: '' };

  public message='';


  public authSerivice = inject(AuthService);
  

  
  

  ngOnInit(): void {
    this.customColor = this.colorFavorite;
    this.selectedCurrency = "USD";   
  }
  
  constructor(private profileSerivice: ProfileService ) {  
    
    this.loadUserLogged();     
    
   }

    async loadUserLogged() {
    await this.authSerivice.getUserLogged().subscribe((user) => {
      this.userlogged = {uid: user.uid, email: user.email, name: user.name};

      if (this.userlogged.uid ) {
        this.profileSerivice.getUserProfileByUserId(this.userlogged.uid).then((profile) => {
          if (profile) {
            this.getProfile(this.userlogged.uid);
            this.isLoading = true;
          } else {
            console.error("Profile not found");
          }
        });
      }


      
    });
    
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
      photoURL: this.photoUrl,
      sharedExpense: this.isSharedExpenseEnabled,
      emailShared: this.sharedEmails
    };

    try {
      await this.profileSerivice.addProfile(userProfile);
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

  async getProfile(userUid:string) {
   
   await this.profileSerivice.getUserProfileByUserId(this.userlogged.uid).then((profile) => {
      if (profile) {
        this.colorFavorite = profile.color;
        this.selectedCurrency = profile.currency;
        this.isSharedExpenseEnabled = profile.sharedExpense;
        this.sharedEmails = profile.emailShared || [];
        this.photoUrl = profile.photoURL;
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
