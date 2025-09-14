import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
import { Multiselect } from '../../../shared/components/multiselect/multiselect';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { Note } from '../../../shared/models/note';
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
  private readonly router = inject(Router);
  protected readonly commonStore = inject(CommonStore);
  protected readonly isLoading: Signal<boolean> = computed(() => this.noteStore.loading());
  protected readonly notes: Signal<Note[]> = computed(() => this.noteStore.filteredNotes());
  protected readonly currentUserId: Signal<string | null> = computed(
    () => this.auth.user()?.id ?? null
  );
  protected readonly searchText: Signal<string> = computed(() => this.noteStore.filters().text);

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
    this.noteStore.remove(note.id).subscribe({
      next: () => {
        this.toast.show({ message: 'Nota eliminata', type: ToastType.Success, seconds: 3 });
      },
      error: () => {
        this.toast.show({ message: 'Errore eliminazione nota', type: ToastType.Error, seconds: 5 });
      },
    });
  }

  protected openDetails(id: string): void {
    if (!id) return;
    this.router.navigate(['/notes', id]);
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
