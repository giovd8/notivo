import { NgClass, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs/operators';
import packageJson from '../../../../../package.json';
import { AuthStore } from '../../../auth/auth.store';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { SidenavItem } from '../../models';
import { sidenavItems } from '../../utils';

@Component({
  selector: 'notivo-sidenav',
  templateUrl: './sidenav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, RouterLinkActive, NgOptimizedImage, Tooltip],
  host: {
    class: 'w-60 h-full notivo-card !bg-primary text-white',
  },
})
export class Sidenav {
  // Services
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  currentRoute = '';
  sidenavItems = signal<SidenavItem[]>(sidenavItems);
  user = computed(() => this.authStore.user());
  username = computed(() => this.user()?.username ?? '');
  initial = computed(() => (this.username() ? this.username().charAt(0).toUpperCase() : ''));
  version = signal<string>(packageJson.version);

  constructor() {
    // // Router events subscription
    // this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
    //   if (event instanceof NavigationEnd || event instanceof Scroll) {
    //     // Used scroll with NavigationEnd because on refresh page (after modified auth guard) NavigationEnd is not triggered
    //     if (event instanceof NavigationEnd) this.currentRoute = event.url;
    //     else this.currentRoute = event.routerEvent.url;
    //   }
    // });
  }

  logout(): void {
    this.authStore
      .logout()
      .pipe(finalize(() => this.router.navigate(['/login'])))
      .subscribe();
  }
}
