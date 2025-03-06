import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideRouter } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANoafhXEg3kMCj24AoD1_JDfwFspvgsdg",
  authDomain: "gastosdb-2f9d2.firebaseapp.com",
  projectId: "gastosdb-2f9d2",
  storageBucket: "gastosdb-2f9d2.firebasestorage.app",
  messagingSenderId: "1062395447238",
  appId: "1:1062395447238:web:155389f67e43d76b5a54c7",
  measurementId: "G-W6318P4KDF"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
        theme: {
            preset: Aura
        }
    }),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())  // Proveer el servicio Auth
  ]
};
