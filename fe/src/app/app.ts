import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidenav } from './core/components/sidenav/sidenav';
import { Toast } from './core/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidenav, Toast],
  templateUrl: './app.html',
  styles: [],
})
export class App {
  protected readonly title = signal('notivo');

  isUserLoggedIn = signal(false);
}
