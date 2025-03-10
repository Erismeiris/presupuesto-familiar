import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { FileUpload } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { User, UserProfile } from '../../interface/user.interface';
import { ProfileService } from '../../services/profile.service';



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
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {

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
  public profileSerivice = inject(ProfileService);

  ngOnInit(): void {
    this.loadSavedSettings(); 
    this.customColor = this.colorFavorite;
    this.selectedCurrency = "USD";   
   }

   constructor() {
    this.loadUserLogged(); 
   }

   async loadUserLogged() {
   await this.authSerivice.getUserLogged().subscribe((user) => {
      this.userlogged = {uid: user.uid, email: user.email, name: user.name};
      console.log("Usuario logueado", this.userlogged);
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
 
  

  onUpload(event: any) {
    console.log("Evento change ejecutado:", event);
    const fileList: FileList = event.target.files;
    console.log("FileList:", fileList);
    if (fileList && fileList.length > 0) {
      const file: File = fileList[0];
      console.log("Archivo seleccionado:", file);
      console.log("Nombre del archivo:", file.name);
    } else {
      console.log("No se seleccionó ningún archivo");
    }
  }

  saveSettings(): void {
    const settings = {
      userId: this.userlogged.uid,
      useName: this.userlogged.name,
      customColor: this.customColor,
      currency: this.selectedCurrency,
      sharedExpense: this.isSharedExpenseEnabled,
      sharedEmails: this.sharedEmails
    };
    this.profileSerivice.addProfile(settings);
    console.log("Settings saved:", settings);
  }

  showCard(): void {
    this.isCardVisible = true;
  }

  hideCard(): void {
    this.isCardVisible = false;
  }
}
