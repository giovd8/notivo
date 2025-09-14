import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAuthenticated()) {
    return true;
  }

  return store.refresh().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'], { queryParams: { redirect: state.url } })))
  );
};
