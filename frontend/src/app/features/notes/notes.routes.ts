import { Routes } from '@angular/router';

const prefix = 'notes';

export const notesRoutes: Routes = [
  {
    path: prefix,
    loadComponent: () => import('./notes-list/notes-list').then((m) => m.NotesList),
  },
  {
    path: `${prefix}/add`,
    loadComponent: () =>
      import('./create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: `${prefix}/edit/:id`,
    loadComponent: () =>
      import('./create-edit-note/create-edit-note').then((m) => m.CreateEditNote),
  },
  {
    path: `${prefix}/:id`,
    loadComponent: () => import('./note-details/note-details').then((m) => m.NoteDetails),
  },
];
