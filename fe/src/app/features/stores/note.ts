import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { finalize, share, switchMap, tap } from 'rxjs';
import { NotivoResponse } from '../../core/models';
import { ApiService } from '../../services/api';
import { Note, NotePayload } from '../../shared/models/note';

interface NoteFiltersState {
  text: string;
  tags: string[];
}

interface NotesState {
  notes: Note[];
  loading: boolean;
  filters: NoteFiltersState;
}

const initialState: NotesState = {
  notes: [],
  loading: false,
  filters: {
    text: '',
    tags: [],
  },
};

export const NoteStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ notes, filters }) => ({
    filteredNotes: computed(() => {
      const all = notes();
      const { text, tags } = filters();

      const hasText = (text ?? '').trim().length > 0;
      const selectedTags = tags ?? [];
      const hasTags = selectedTags.length > 0;

      if (!hasText && !hasTags) return all;

      const lowerText = (text ?? '').toLowerCase();

      return all.filter((n) => {
        let match = true;
        if (hasText) {
          const inTitle = (n.title ?? '').toLowerCase().includes(lowerText);
          const inBody = (n.body ?? '').toLowerCase().includes(lowerText);
          match = match && (inTitle || inBody);
        }
        if (hasTags) {
          const noteTags = n.tags ?? [];
          // Match notes that contain ALL selected tags
          match = match && selectedTags.every((t) => noteTags.includes(t));
        }
        return match;
      });
    }),
  })),
  withMethods((store) => {
    const api = inject(ApiService);

    return {
      load: () => {
        patchState(store, { loading: true });
        return api.listNotes().pipe(
          tap((res: NotivoResponse<Note[]>) => {
            patchState(store, { notes: res.data });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      refresh: () => {
        patchState(store, { loading: true });
        return api.listNotes().pipe(
          tap((res: NotivoResponse<Note[]>) => {
            patchState(store, { notes: res.data });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      setSearchText: (text: string) => {
        const current = store.filters();
        patchState(store, { filters: { ...current, text } });
      },

      setSelectedTags: (tags: string[]) => {
        const current = store.filters();
        patchState(store, { filters: { ...current, tags } });
      },

      clearFilters: () => {
        patchState(store, { filters: { text: '', tags: [] } });
      },

      create: (payload: NotePayload) => {
        patchState(store, { loading: true });
        return api.createNote(payload).pipe(
          // After creation, reset filters and reload the full list from DB
          switchMap(() => api.listNotes()),
          tap((res: NotivoResponse<Note[]>) => {
            patchState(store, {
              notes: res.data,
              filters: { text: '', tags: [] },
            });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      update: (id: string, payload: NotePayload) => {
        patchState(store, { loading: true });
        return api.updateNote(id, payload).pipe(
          tap((res: NotivoResponse<Note>) => {
            const updated = res.data;
            const updatedList = store.notes().map((n) => (n.id === updated.id ? updated : n));
            patchState(store, { notes: updatedList });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      remove: (id: string) => {
        patchState(store, { loading: true });
        return api.deleteNote(id).pipe(
          tap(() => {
            const updatedList = store.notes().filter((n) => n.id !== id);
            patchState(store, { notes: updatedList });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },
    };
  })
);
