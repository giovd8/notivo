import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NoteService } from '../../services/note';
import { AddNoteButton } from '../../shared/components/add-note-button/add-note-button';

@Component({
  selector: 'notivo-home',
  imports: [AddNoteButton],
  templateUrl: './home.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly api = inject(NoteService);
}
