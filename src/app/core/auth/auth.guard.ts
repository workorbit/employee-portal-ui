import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { selectAuthInitialized, selectIsAuthenticated } from '../../store/auth/auth.selectors';

/**
 * Waits for the app-boot session restore (see AuthEffects.restoreSession$)
 * to finish before deciding — otherwise a hard page reload would bounce an
 * already-logged-in user to /login while the refresh call is still in flight.
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
    switchMap(() => store.select(selectIsAuthenticated)),
    take(1),
    map((isAuthenticated) => isAuthenticated || router.createUrlTree(['/login'])),
  );
};
