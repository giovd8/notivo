import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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

  createNote(payload: NotePayload) {
    return this.http.post<NotivoResponse<Note>>(`/api/note/notes`, payload, {
      withCredentials: true,
    });
  }
}
