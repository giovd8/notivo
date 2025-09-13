import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth-guard';
export const routes: Routes = [
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'notes/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: 'notes/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: 'notes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/all-notes/all-notes').then((m) => m.AllNotes),
  },
  {
    path: 'notes/my',
    canActivate: [authGuard],
    loadComponent: () => import('./features/my-notes/my-notes').then((m) => m.MyNotes),
  },
  {
    path: 'notes/shared',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shared-with-me/shared-with-me').then((m) => m.SharedWithMe),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
