import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthStore } from '../../auth/auth.store';
import { ToastService } from '../services/toast';

const DEFAULT_ERROR_MESSAGE = 'Si è verificato un errore imprevisto. Riprova più tardi.';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      let message = DEFAULT_ERROR_MESSAGE;

      // if error is 401, logout
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('auth')) {
        authStore
          .logout()
          .pipe(finalize(() => router.navigate(['/login'])))
          .subscribe();
      }

      if (err instanceof HttpErrorResponse) {
        const maybeMessage = (err.error && (err.error as { message?: unknown }).message) as
          | string
          | undefined;
        if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
          message = maybeMessage.trim();
        }
      }

      // toast.show({ message, type: ToastType.Error, seconds: 6 });

      return throwError(() => err);
    })
  );
};
