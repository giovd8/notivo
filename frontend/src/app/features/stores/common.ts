import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { finalize, forkJoin, share, tap } from 'rxjs';
import { NotivoResponse } from '../../core/models';
import { Common as CommonService } from '../../services/common';
import { LabelValue } from '../../shared/models/utils';

interface CommonState {
  tags: LabelValue[];
  users: LabelValue[];
  loading: boolean;
}

const initialState: CommonState = {
  tags: [],
  users: [],
  loading: false,
};

export const CommonStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ tags, users }) => ({
    tagOptions: computed<LabelValue[]>(() => tags()),
    userOptions: computed<LabelValue[]>(() => users()),
  })),
  withMethods((store) => {
    const common = inject(CommonService);

    return {
      loadTags: () => {
        patchState(store, { loading: true });
        return common.getTags().pipe(
          tap((res: NotivoResponse<LabelValue[]>) => {
            patchState(store, { tags: res.data });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      loadUsers: () => {
        patchState(store, { loading: true });
        return common.getUsers().pipe(
          tap((res: NotivoResponse<LabelValue[]>) => {
            patchState(store, { users: res.data });
          }),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },

      loadAll: () => {
        patchState(store, { loading: true });
        return forkJoin({ tags: common.getTags(), users: common.getUsers() }).pipe(
          tap(
            (result: {
              tags: NotivoResponse<LabelValue[]>;
              users: NotivoResponse<LabelValue[]>;
            }) => {
              patchState(store, { tags: result.tags.data, users: result.users.data });
            }
          ),
          finalize(() => patchState(store, { loading: false })),
          share()
        );
      },
    };
  }),
  withHooks((store) => {
    return {
      onInit: () => {
        store.loadAll().subscribe();
      },
    };
  })
);
