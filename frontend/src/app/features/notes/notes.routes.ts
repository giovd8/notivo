import { Routes } from '@angular/router';

export const notesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./notes-list/notes-list').then((m) => m.NotesList),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: ':id',
    loadComponent: () => import('./note-details/note-details').then((m) => m.NoteDetails),
  },
];
