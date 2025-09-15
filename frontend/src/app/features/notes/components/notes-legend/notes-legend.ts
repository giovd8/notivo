import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'notivo-notes-legend',
  imports: [],
  templateUrl: './notes-legend.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-label': 'Legenda colori delle note',
  },
})
export class NotesLegend {}
