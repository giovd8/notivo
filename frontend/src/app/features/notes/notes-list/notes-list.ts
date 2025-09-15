import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
  Signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
import { ModalService } from '../../../services/modal.service';
import { Multiselect } from '../../../shared/components/multiselect/multiselect';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { Note } from '../../../shared/models/note';
import { LabelValue } from '../../../shared/models/utils';
import { CommonStore } from '../../stores/common';
import { NoteStore } from '../../stores/note';
import { NotesLegend } from '../components/notes-legend/notes-legend';

@Component({
  selector: 'notivo-notes-list',
  imports: [RouterLink, NgClass, DatePipe, Tooltip, Spinner, SearchBar, Multiselect, NotesLegend],
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
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  protected readonly noteStore = inject(NoteStore);
  protected readonly commonStore = inject(CommonStore);
  private readonly modalService = inject(ModalService);
  protected readonly isLoading: Signal<boolean> = computed(() => this.noteStore.loading());
  protected readonly notes: Signal<Note[]> = computed(() => this.noteStore.filteredNotes());
  protected readonly currentUserId: Signal<string | null> = computed(
    () => this.auth.user()?.id ?? null
  );
  protected readonly searchText: Signal<string> = computed(() => this.noteStore.filters().text);
  protected readonly selectedTags: Signal<LabelValue[]> = computed(() => {
    const selectedTagValues = this.noteStore.filters().tags;
    const allTagOptions = this.commonStore.tagOptions();
    return allTagOptions.filter((tag) => selectedTagValues.includes(tag.value));
  });

  selectedNote = model<Note | null>(null);
  showForm = output<boolean>();

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
    const current = this.selectedNote();
    if (!current) return;
    if (!this.canDelete(current)) return;
    this.noteStore.remove(current!.id).subscribe({
      next: () => {
        this.toast.show({ message: 'Nota eliminata', type: ToastType.Success, seconds: 3 });
        // this.showForm.set(false);
      },
      error: () => {
        this.toast.show({ message: 'Errore eliminazione nota', type: ToastType.Error, seconds: 5 });
      },
    });
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
    this.noteStore.remove(note.id).subscribe({
      next: () => {
        this.toast.show({ message: 'Nota eliminata', type: ToastType.Success, seconds: 3 });
      },
      error: () => {
        this.toast.show({ message: 'Errore eliminazione nota', type: ToastType.Error, seconds: 5 });
      },
    });
  }

  protected onSearchTextChange(value: string): void {
    this.noteStore.setSearchText(value ?? '');
    this.noteStore.load();
  }

  protected onTagsChange(values: string[]): void {
    this.noteStore.setSelectedTags(values ?? []);
    this.noteStore.load();
  }
}
