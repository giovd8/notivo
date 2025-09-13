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
      import('./features/notes/create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: 'notes/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notes/create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: 'notes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notes/notes-list/notes-list').then((m) => m.NotesList),
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
