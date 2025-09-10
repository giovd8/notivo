import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidenavItem, SidenavType } from '../../models';
import packageJson from '../../../../../package.json';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Scroll } from '@angular/router';
import { NgClass } from '@angular/common';
import { TooltipComponent } from '../../../shared/components/tooltip/tooltip.component';
import { sidenavItems } from '../../utils';

@Component({
  selector: 'notivo-sidenav',
  templateUrl: './sidenav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, RouterLinkActive],
  host: {
    class: 'w-60 h-full notivo-card !bg-primary text-white',
  },
})
export class SidenavComponent {
  // Services
  private readonly router = inject(Router);
  // private readonly authService = inject(AuthService);

  currentRoute = '';
  sidenavItems = signal<SidenavItem[]>(sidenavItems);
  version = signal<string>(packageJson.version);

  constructor() {
    // Router events subscription
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd || event instanceof Scroll) {
        // Used scroll with NavigationEnd because on refresh page (after modified auth guard) NavigationEnd is not triggered
        if (event instanceof NavigationEnd) this.currentRoute = event.url;
        else this.currentRoute = event.routerEvent.url;
      }
    });

    // Auth service subscription
    // this.authService
    //   .getUser()
    //   .pipe(takeUntilDestroyed())
    //   .subscribe((user) => {
    //     this.showMenuItems.set(!!user);
    //   });
  }

  /**
   * Handles click events on menu items
   * Manages submenu expansion and navigation
   */
  async itemClickedHandler(item: SidenavItem): Promise<void> {
    await this.router.navigate([item.route]);
    // if (item.clicked && !!item.subItems) {
    //   item.clicked = false;
    //   return;
    // }
    // this.sidenavItems.update((sidenavItems) => {
    //   return sidenavItems.map((sidenavItem: SidenavItem) => {
    //     return {
    //       ...sidenavItem,
    //       clicked: sidenavItem === item,
    //     };
    //   });
    // });
    // if (!item.subItems) {
    //   this.breadcrumbService.resetData();
    //   this.breadcrumbService.addBreadCrumb({
    //     label: item.name,
    //     url: item.route,
    //   });
    //   await this.router.navigate([item.route]);
    // }
  }
}
