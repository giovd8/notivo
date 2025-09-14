import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'notivo-tooltip',
  imports: [NgClass],
  templateUrl: './tooltip.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tooltip {
  text = input.required<string>();
  position = input<TooltipPosition>('top');
}
