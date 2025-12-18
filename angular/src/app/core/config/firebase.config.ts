import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { ApplicationConfig } from '@angular/core';

/**
 * Firebase Configuration for Angular 21
 * 
 * Angular Fire 21.0.0-rc.0 is now installed and compatible with Angular 21.
 * 
 * To use Firebase, add your config to environment files:
 * 
 * environment.ts:
 * export const environment = {
 *   firebase: {
 *     apiKey: "your-api-key",
 *     authDomain: "your-project.firebaseapp.com",
 *     projectId: "your-project-id",
 *     storageBucket: "your-project.appspot.com",
 *     messagingSenderId: "123456789",
 *     appId: "your-app-id",
 *     measurementId: "G-XXXXXXXXXX"
 *   }
 * }
 */

/**
 * Firebase Provider Function for Angular 21
 * 
 * Provides Firebase services using Angular Fire 21.0.0-rc.0
 */
export function provideFirebase(config: any): ApplicationConfig['providers'] {
  return [
    provideFirebaseApp(() => initializeApp(config)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions()),
    // Only enable analytics in browser environment and if measurementId is provided
    ...(typeof window !== 'undefined' && config.measurementId
      ? [provideAnalytics(() => getAnalytics())]
      : []),
  ];
}

/**
 * Example usage in app.config.ts:
 * 
 * import { provideFirebase } from './core/config/firebase.config';
 * import { environment } from '../environments/environment';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     ...provideFirebase(environment.firebase),
 *     // ... other providers
 *   ],
 * };
 */

