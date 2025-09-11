import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);

  test() {
    return this.http.get(`/api/auth`).subscribe(
      (res) => {
        console.log(res);
      },
      (err) => {
        console.error(err);
      },
      () => {
        console.log('completed');
      }
    );
  }
}
