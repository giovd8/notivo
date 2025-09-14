import { SidenavItem } from './models';

export const sidenavItems: SidenavItem[] = [
  {
    title: 'Home',
    icon: 'bi bi-house',
    route: '/home',
    spacing: false,
  },
  {
    title: 'Note',
    icon: 'bi bi-file-earmark-text',
    route: '/notes',
    spacing: false,
  },
  // {
  //   title: 'Le mie note',
  //   icon: 'bi bi-file-earmark-person',
  //   route: 'notes/my',
  //   spacing: false,
  // },
  // {
  //   title: 'Condivise con me',
  //   icon: 'bi bi-people',
  //   route: 'notes/shared',
  //   spacing: false,
  // },
];
