import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is already authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // Try to refresh token if not authenticated
  return authService.refreshToken().pipe(
    map(() => {
      return authService.isAuthenticated();
    }),
    catchError(() => {
      // Refresh failed, redirect to login
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return of(false);
    })
  );
};
