import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { AuthStore } from './auth/auth.store';
import { Modal } from './core/components/modal/modal';
import { Sidenav } from './core/components/sidenav/sidenav';
import { Toast } from './core/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidenav, Toast, Modal],
  templateUrl: './app.html',
  styles: [],
})
export class App implements OnDestroy {
  protected readonly title = signal('notivo');
  protected readonly store = inject(AuthStore);

  isUserLoggedIn = signal(false);

  refreshInterval = interval(14 * 60 * 1000);
  private refreshIntervalSubscription: Subscription | null = null;

  constructor() {
    effect(() => {
      if (this.store.isAuthenticated()) {
        this.isUserLoggedIn.set(true);
        if (!this.refreshIntervalSubscription) {
          this.refreshIntervalSubscription = this.refreshInterval.subscribe(() => {
            this.store.refresh().subscribe();
          });
        }
      } else {
        this.isUserLoggedIn.set(false);
        this.refreshIntervalSubscription?.unsubscribe();
        this.refreshIntervalSubscription = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshIntervalSubscription?.unsubscribe();
    this.refreshIntervalSubscription = null;
  }
}
