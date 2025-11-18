import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService, API_ENDPOINTS } from './api.service';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'user';
  private readonly CSRF_KEY = 'csrfToken';

  // Signals for reactive state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  constructor() {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<any> {
    this.isLoading.set(true);
    
    return this.apiService.post(API_ENDPOINTS.auth.login, credentials).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const { token, user } = response.data;
          
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
            this.isAuthenticated.set(true);
          }
          
          if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUser.set(user);
          }
          
          // Handle remember me
          if (credentials.remember) {
            // Store additional session data if needed
          }
        }
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  register(data: RegisterData): Observable<any> {
    this.isLoading.set(true);
    
    return this.apiService.post(API_ENDPOINTS.auth.register, data).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const { token, user } = response.data;
          
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
            this.isAuthenticated.set(true);
          }
          
          if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUser.set(user);
          }
        }
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  logout(): Observable<any> {
    return this.apiService.post(API_ENDPOINTS.auth.logout).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        // Even if logout fails on server, clear local auth
        this.clearAuth();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): Observable<any> {
    return this.apiService.get(API_ENDPOINTS.auth.me).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const user = response.data;
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    return this.currentUser();
  }

  checkAuth(): boolean {
    const token = this.getToken();
    const isAuth = !!token && this.isAuthenticated();
    
    if (!isAuth && token) {
      // Token exists but state is not set, reload user
      this.getCurrentUser().subscribe();
    }
    
    return isAuth;
  }

  redirectToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.CSRF_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  generateCsrfToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem(this.CSRF_KEY, token);
    return token;
  }

  getCsrfToken(): string | null {
    return sessionStorage.getItem(this.CSRF_KEY);
  }
}

