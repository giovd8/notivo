import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastType } from '../models';
import { ToastService } from '../services/toast';

const DEFAULT_ERROR_MESSAGE = 'Si è verificato un errore imprevisto.';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      let message = DEFAULT_ERROR_MESSAGE;

      if (err instanceof HttpErrorResponse) {
        const maybeMessage = (err.error && (err.error as { message?: unknown }).message) as
          | string
          | undefined;
        if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
          message = maybeMessage.trim();
        }
      }

      toast.show({ message, type: ToastType.Error, seconds: 6 });

      return throwError(() => err);
    })
  );
};
