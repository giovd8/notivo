import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'notivo-add-note-button',
  imports: [],
  templateUrl: './add-note-button.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteButton {
  protected readonly onAddNoteClick = output<void>();
}
