import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth-guard';
export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/notes/notes.routes').then((m) => m.notesRoutes),
  },
  {
    path: '**',
    redirectTo: 'notes',
    pathMatch: 'full',
  },
];
