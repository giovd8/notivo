import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotivoResponse } from '../core/models';
import { Note, NotePayload } from '../shared/models/note';
import { User } from '../shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  createNote(payload: NotePayload): Observable<NotivoResponse<Note>> {
    return this.http.post<NotivoResponse<Note>>(`/api/notes`, payload, {
      withCredentials: true,
    });
  }

  updateNote(id: string, payload: NotePayload): Observable<NotivoResponse<Note>> {
    return this.http.put<NotivoResponse<Note>>(`/api/notes/${id}`, payload, {
      withCredentials: true,
    });
  }

  listNotes(): Observable<NotivoResponse<Note[]>> {
    return this.http.get<NotivoResponse<Note[]>>(`/api/notes`, { withCredentials: true });
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`, { withCredentials: true });
  }

  getUser(): Observable<User> {
    return this.http.get<User>(`/api/user`, { withCredentials: true });
  }
}
