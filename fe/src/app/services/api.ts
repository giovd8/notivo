import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  test() {
    return this.http.get(`/api/healthz`).subscribe(
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
