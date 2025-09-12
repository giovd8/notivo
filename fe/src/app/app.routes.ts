import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  // {
  //   path: 'notes',
  //   canActivate: [authGuard],
  //   loadComponent: () => import('./features/notes/notes').then((m) => m.Notes),
  // },
  // {
  //   path: 'shared',
  //   canActivate: [authGuard],
  //   loadComponent: () => import('./features/shared/shared').then((m) => m.Shared),
  // },
];
