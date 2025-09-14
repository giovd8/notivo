import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { finalize, share, switchMap, tap } from 'rxjs';
import { NotivoResponse } from '../../core/models';
import { NoteService } from '../../services/note';
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
          const noteTags = (n.tags ?? []).map((t) => t.value);
          // Match notes that contain ALL selected tags
          match = match && selectedTags.every((t) => noteTags.includes(t));
        }
        return match;
      });
    }),
  })),
  withMethods((store) => {
    const api = inject(NoteService);

    return {
      load: () => {
        patchState(store, { loading: true });
        const { text, tags } = store.filters();
        return api.getAll(text, tags).pipe(
          tap((res: NotivoResponse<Note[]>) => {
            patchState(store, { notes: res.data });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      refresh: () => {
        patchState(store, { loading: true });
        const { text, tags } = store.filters();
        return api.getAll(text, tags).pipe(
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
        // Auto-fetch with current filters
        patchState(store, { loading: true });
        const { text: s, tags } = store.filters();
        api
          .getAll(s, tags)
          .pipe(
            tap((res: NotivoResponse<Note[]>) => {
              patchState(store, { notes: res.data });
            }),
            finalize(() => patchState(store, { loading: false })),
            share()
          )
          .subscribe();
      },

      setSelectedTags: (tags: string[]) => {
        const current = store.filters();
        patchState(store, { filters: { ...current, tags } });
        // Auto-fetch with current filters
        patchState(store, { loading: true });
        const { text, tags: currentTags } = store.filters();
        api
          .getAll(text, currentTags)
          .pipe(
            tap((res: NotivoResponse<Note[]>) => {
              patchState(store, { notes: res.data });
            }),
            finalize(() => patchState(store, { loading: false })),
            share()
          )
          .subscribe();
      },

      clearFilters: () => {
        patchState(store, { filters: { text: '', tags: [] } });
        // Auto-fetch with cleared filters
        patchState(store, { loading: true });
        api
          .getAll('', [])
          .pipe(
            tap((res: NotivoResponse<Note[]>) => {
              patchState(store, { notes: res.data });
            }),
            finalize(() => patchState(store, { loading: false })),
            share()
          )
          .subscribe();
      },

      create: (payload: NotePayload) => {
        patchState(store, { loading: true });
        return api.createOne(payload).pipe(
          // After creation, reset filters and reload the full list from DB
          switchMap(() => api.getAll()),
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
        return api.updateOne(id, payload).pipe(
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
        return api.deleteOne(id).pipe(
          tap(() => {
            const updatedList = store.notes().filter((n) => n.id !== id);
            patchState(store, { notes: updatedList });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },
    };
  }),
  withHooks((store) => {
    return {
      onInit: () => {
        store.load().subscribe();
      },
    };
  })
);
