import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthStore } from '../../../auth/auth.store';
import { NotivoResponse, ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
import { NoteService } from '../../../services/note';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { Note } from '../../../shared/models/note';

@Component({
  selector: 'notivo-notes-list',
  imports: [RouterLink, NgClass, DatePipe, Tooltip],
  templateUrl: './notes-list.html',
  styles: `
    .clamp-10 {
      display: -webkit-box;
      -webkit-line-clamp: 10;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesList {
  private readonly api = inject(NoteService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly notes = signal<Note[]>([]);
  protected readonly currentUserId: Signal<string | null> = computed(
    () => this.auth.user()?.id ?? null
  );

  constructor() {
    this.fetchNotes();
  }

  protected fetchNotes(): void {
    this.isLoading.set(true);
    this.api
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: NotivoResponse<Note[]>) => {
          this.notes.set(res.data ?? []);
        },
        error: () => {
          this.toast.show({
            message: 'Errore nel recupero delle note',
            type: ToastType.Error,
            seconds: 5,
          });
        },
      });
  }

  protected canDelete(note: Note): boolean {
    return (this.currentUserId() ?? '') === note.ownerId;
  }

  protected getShareBadge(note: Note): { label: string; colorClass: string; icon: string } | null {
    const userId = this.currentUserId();
    if (!userId) return null;
    if (note.ownerId === userId) {
      const hasShared = (note.sharedWith ?? []).length > 0;
      return hasShared
        ? {
            label: 'Condivisa da me',
            colorClass: 'bg-green-100 text-green-700 border-green-300',
            icon: 'bi bi-people',
          }
        : {
            label: 'Personale',
            colorClass: 'bg-green-100 text-green-700 border-green-300',
            icon: 'bi bi-person',
          };
    }
    return {
      label: 'Condivisa con me',
      colorClass: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: 'bi bi-people',
    };
  }

  protected delete(note: Note): void {
    if (!this.canDelete(note)) return;
    this.api.deleteOne(note.id).subscribe({
      next: () => {
        this.toast.show({ message: 'Nota eliminata', type: ToastType.Success, seconds: 3 });
        this.notes.set(this.notes().filter((n) => n.id !== note.id));
      },
      error: () => {
        this.toast.show({ message: 'Errore eliminazione nota', type: ToastType.Error, seconds: 5 });
      },
    });
  }
}
