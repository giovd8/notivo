import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { NotivoResponse } from '../../core/models';
import { User, UserCredential } from '../../shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(data: UserCredential): Observable<NotivoResponse<User>> {
    return this.http.post<NotivoResponse<User>>('/api/auth/login', data).pipe(share());
  }

  register(data: UserCredential): Observable<NotivoResponse<User>> {
    return this.http.post<NotivoResponse<User>>('/api/auth/register', data).pipe(share());
  }

  refresh(): Observable<NotivoResponse<User>> {
    return this.http
      .post<NotivoResponse<User>>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(share());
  }

  logout(): Observable<NotivoResponse<void>> {
    return this.http
      .post<NotivoResponse<void>>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(share());
  }
}
