import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - clear auth and redirect to login
        authService.logout().subscribe();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden - redirect to dashboard
        router.navigate(['/dashboard']);
      }

      return throwError(() => error);
    })
  );
};

