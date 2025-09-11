import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { share } from 'rxjs/operators';
import { UserCreateDTO } from '../../shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(data: UserCreateDTO) {
    return this.http.post('/api/auth/login', data).pipe(share());
  }

  register(data: UserCreateDTO) {
    return this.http.post('/api/auth/register', data).pipe(share());
  }
}
