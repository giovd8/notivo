import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { catchError, share, tap } from 'rxjs';
import { NotivoResponse } from '../core/models';
import { User, UserCredential } from '../shared/models/user';
import { AuthService } from './services/auth';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    let authService = inject(AuthService);

    return {
      login: (credentials: UserCredential) => {
        return authService.login(credentials).pipe(
          tap((response: NotivoResponse<User>) => {
            patchState(store, {
              user: response.data,
              isAuthenticated: true,
            });
          }),
          share()
        );
      },

      register: (credentials: UserCredential) => {
        return authService.register(credentials).pipe(
          tap((response: NotivoResponse<User>) => {
            patchState(store, {
              user: response.data,
              isAuthenticated: true,
            });
          }),
          share()
        );
      },

      refresh: () => {
        return authService.refresh().pipe(
          tap((response: NotivoResponse<User>) => {
            patchState(store, {
              user: response.data,
              isAuthenticated: true,
            });
          }),
          catchError((err) => {
            console.error('Refresh fallito', err);
            patchState(store, {
              user: null,
              isAuthenticated: false,
            });
            throw err;
          }),
          share()
        );
      },

      logout: () => {
        return authService.logout().pipe(
          tap(() => {
            patchState(store, {
              user: null,
              isAuthenticated: false,
            });
          }),
          share()
        );
      },
    };
  })
);
