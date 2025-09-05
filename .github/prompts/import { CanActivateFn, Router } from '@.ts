import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token exists and is valid
  if (authService.isTokenValid()) {
    return true;
  }

  // Try to refresh token
  return authService.refreshToken().pipe(
    map(() => {
      return authService.isTokenValid();
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
