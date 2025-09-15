import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { Note } from '../../shared/models/note';
import { CreateEditNote } from './create-edit-note/create-edit-note';
import { NoteDetails } from './note-details/note-details';
import { NotesList } from './notes-list/notes-list';

@Component({
  selector: 'notivo-notes',
  imports: [NotesList, NoteDetails, CreateEditNote],
  templateUrl: './notes.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notes {
  selectedNote = signal<Note | null>(null);
  showForm = signal(false);

  constructor() {
    effect(() => {
      if (this.selectedNote()) {
        this.showForm.set(false);
      }
    });
  }
}
