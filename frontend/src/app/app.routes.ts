import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth-guard';
export const routes: Routes = [
  {
    path: 'notes',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./features/notes/notes').then((m) => m.Notes),
  },
  {
    path: '',
    redirectTo: 'notes',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'notes',
    pathMatch: 'full',
  },
];
