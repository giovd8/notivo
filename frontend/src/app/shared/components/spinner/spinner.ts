import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'notivo-spinner',
  imports: [],
  templateUrl: './spinner.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {
  size = input<string>('w-8 h-8');
}
