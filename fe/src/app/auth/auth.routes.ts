import { Route } from '@angular/router';
import { notAuthGuard } from './guards/not-auth-guard';

export const authRoutes: Route[] = [
  {
    path: 'register',
    canActivate: [notAuthGuard],
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'login',
    canActivate: [notAuthGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
];
