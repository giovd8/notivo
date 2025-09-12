import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../auth.store';

export const notAuthGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAuthenticated()) {
    return router.createUrlTree(['/'], { queryParams: { redirect: state.url } });
  }

  return store.refresh().pipe(
    map(() => router.createUrlTree(['/'])),
    catchError(() => of(true))
  );
};
