import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotivoResponse } from '../core/models';
import { Note, NotePayload } from '../shared/models/note';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private readonly http = inject(HttpClient);

  createOne(payload: NotePayload): Observable<NotivoResponse<Note>> {
    return this.http.post<NotivoResponse<Note>>(`/api/notes`, payload, {
      withCredentials: true,
    });
  }

  updateOne(id: string, payload: NotePayload): Observable<NotivoResponse<Note>> {
    return this.http.put<NotivoResponse<Note>>(`/api/notes/${id}`, payload, {
      withCredentials: true,
    });
  }

  getAll(search?: string, tags?: string[]): Observable<NotivoResponse<Note[]>> {
    let params = new HttpParams();
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (Array.isArray(tags) && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }
    return this.http.get<NotivoResponse<Note[]>>(`/api/notes`, { withCredentials: true, params });
  }

  deleteOne(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`, { withCredentials: true });
  }
}
