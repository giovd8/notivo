import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserCredential } from '../../../shared/models/user';
import { AuthStore } from '../../auth.store';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'notivo-login',
  imports: [ReactiveFormsModule, RouterLink, Header, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  readonly router = inject(Router);
  readonly store = inject(AuthStore);
  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);
  isError = signal(false);

  readonly form = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  });

  submit() {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isError.set(false);
    this.submitting.set(true);
    this.store
      .login(this.form.value as UserCredential)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: () => {
          this.submitting.set(false);
          this.isError.set(true);
        },
      });
  }

  togglePasswordVisibility() {
    this.passwordVisible.update((v) => !v);
  }
}
