import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotivoResponse } from '../core/models';
import { Note, NotePayload } from '../shared/models/note';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  test() {
    return this.http.get(`/api/healthz`).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        console.error(err);
      },
      complete: () => {
        console.log('completed');
      },
    });
  }

  createNote(payload: NotePayload): Observable<NotivoResponse<Note>> {
    return this.http.post<NotivoResponse<Note>>(`/api/note/notes`, payload, {
      withCredentials: true,
    });
  }

  listNotes(): Observable<NotivoResponse<Note[]>> {
    return this.http.get<NotivoResponse<Note[]>>(`/api/note/notes`, { withCredentials: true });
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/note/notes/${id}`, { withCredentials: true });
  }
}
