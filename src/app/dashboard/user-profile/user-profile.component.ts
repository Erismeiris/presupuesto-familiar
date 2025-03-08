import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';



interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
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
    FileUpload, 
    HttpClientModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {

  colorPalettes: ColorPalette[] = [
    { name: "Default", primary: "#3498db", secondary: "#ecf0f1", accent: "#2ecc71" },
    { name: "Sunset", primary: "#e74c3c", secondary: "#f39c12", accent: "#d35400" },
    { name: "Ocean", primary: "#16a085", secondary: "#2980b9", accent: "#27ae60" },
    { name: "Twilight", primary: "#8e44ad", secondary: "#9b59b6", accent: "#2c3e50" }
  ];
  currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" }
  ];

  selectedPalette: ColorPalette | null = null;
  customColor: string = "#3498db";
  selectedCurrency: string = "USD";
  isSharedExpenseEnabled: boolean = false;
  sharedEmails: string[] = [""];
  isCardVisible: boolean = false;

  public message='';


  ngOnInit(): void {
    this.loadSavedSettings();
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
    document.documentElement.style.setProperty("--secondary-color", palette.secondary);
    document.documentElement.style.setProperty("--accent-color", palette.accent);
  }

  updateCustomTheme(): void {
    this.selectedPalette = null;
    document.documentElement.style.setProperty("--primary-color", this.customColor);
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
    console.log(event);
}

  saveSettings(): void {
    const settings = {
      palette: this.selectedPalette,
      customColor: this.customColor,
      currency: this.selectedCurrency,
      sharedExpense: this.isSharedExpenseEnabled,
      sharedEmails: this.sharedEmails
    };
    localStorage.setItem("profileSettings", JSON.stringify(settings));
  }

  showCard(): void {
    this.isCardVisible = true;
  }

  hideCard(): void {
    this.isCardVisible = false;
  }
}
