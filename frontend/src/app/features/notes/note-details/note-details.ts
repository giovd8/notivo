import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { Modal } from '../../../core/components/modal/modal';
import { ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
import { ModalService } from '../../../services/modal.service';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { Note } from '../../../shared/models/note';
import { NoteStore } from '../../stores/note';

@Component({
  selector: 'notivo-note-details',
  imports: [RouterLink, NgClass, DatePipe, Tooltip, Spinner, Modal],
  templateUrl: './note-details.html',
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly noteStore = inject(NoteStore);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  protected readonly isLoading: Signal<boolean> = computed(() => this.noteStore.loading());
  private readonly noteId: string = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly currentUserId: Signal<string | null> = computed(
    () => this.auth.user()?.id ?? null
  );

  note = input<Note | null>(null);
  selectedNote = model<Note | null>(null);
  showForm = output<boolean>();

  protected getShareBadge(
    note: Note | undefined
  ): { label: string; colorClass: string; icon: string } | null {
    if (!note) return null;
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

  protected canDelete(note: Note | undefined): boolean {
    const userId = this.currentUserId() ?? '';
    return !!note && note.ownerId === userId;
  }

  openDeleteModal(): void {
    this.modalService.open({
      title: 'Elimina nota',
      body: 'Sei sicuro di voler eliminare questa nota?',
      onConfirm: () => this.deleteNote(),
    });
  }

  protected deleteNote(): void {
    const current = this.note();
    if (!current) return;
    if (!this.canDelete(current)) return;
    this.noteStore.remove(current!.id).subscribe({
      next: () => {
        this.toast.show({ message: 'Nota eliminata', type: ToastType.Success, seconds: 3 });
        this.router.navigate(['/notes']);
      },
      error: () => {
        this.toast.show({ message: 'Errore eliminazione nota', type: ToastType.Error, seconds: 5 });
      },
    });
  }
}
