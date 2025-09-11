import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Api } from '../../services/api';

@Component({
  selector: 'notivo-home',
  imports: [],
  templateUrl: './home.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly api = inject(Api);
}
