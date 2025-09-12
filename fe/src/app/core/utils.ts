import { SidenavItem } from './models';

export const sidenavItems: SidenavItem[] = [
  {
    title: 'Home',
    icon: 'bi bi-house',
    route: '/',
    spacing: false,
  },
  {
    title: 'Tutte le note',
    icon: 'bi bi-file-earmark-text',
    route: '/notes',
    spacing: true,
  },
  {
    title: 'Le mie note',
    icon: 'bi bi-file-earmark-person',
    route: '/my-notes',
    spacing: false,
  },
  {
    title: 'Condivise con me',
    icon: 'bi bi-people',
    route: '/shared',
    spacing: false,
  },
];
