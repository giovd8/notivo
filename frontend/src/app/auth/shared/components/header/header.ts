import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'notivo-header',
  imports: [NgOptimizedImage],
  templateUrl: './header.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  title = input.required<string>();
  description = input.required<string>();
}
