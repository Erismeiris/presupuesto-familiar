import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideRouter } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from '../../firebase.config';
import { MessageService } from 'primeng/api';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    providePrimeNG({
        theme: {
            preset: Aura,
            options: {
              darkModeSelector: false || 'none'
          }
        }
    }),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),  
    provideStorage(() => getStorage()),
    MessageService, // Proporcionar globalmente
    
  ]
};
