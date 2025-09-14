import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotivoResponse } from '../core/models';
import { LabelValue } from '../shared/models/utils';

@Injectable({
  providedIn: 'root',
})
export class Common {
  private readonly http = inject(HttpClient);

  getTags(): Observable<NotivoResponse<LabelValue[]>> {
    return this.http.get<NotivoResponse<LabelValue[]>>(`/api/notes/tags`, {
      withCredentials: true,
    });
  }

  getUsers(): Observable<NotivoResponse<LabelValue[]>> {
    return this.http.get<NotivoResponse<LabelValue[]>>(`/api/users`, { withCredentials: true });
  }
}
