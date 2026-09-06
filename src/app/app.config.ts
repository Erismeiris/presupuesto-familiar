import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
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



// Sin esto los importes se formatean en en-US ("€1,657.28" en vez de
// "1.657,28 €"), que es como se venían viendo las cifras del presupuesto.
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' },
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
