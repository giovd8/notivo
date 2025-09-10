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
    icon: 'bi bi-list',
    route: '/notes',
    spacing: true,
  },
  {
    title: 'Condivise con me',
    icon: 'bi bi-share',
    route: '/shared',
    spacing: false,
  },
  {
    title: 'Le mie note',
    icon: 'bi bi-person',
    route: '/my-notes',
    spacing: false,
  },
  {
    title: 'Le mie note',
    icon: 'bi bi-person',
    route: '/my-notes',
    spacing: false,
  },
];
