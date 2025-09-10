import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidenav } from './core/components/sidenav/sidenav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidenav],
  templateUrl: './app.html',
  styles: [],
})
export class App {
  protected readonly title = signal('notivo');
}
