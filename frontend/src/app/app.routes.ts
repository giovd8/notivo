import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth-guard';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'notes',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/notes/notes.routes').then((m) => m.notesRoutes),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
