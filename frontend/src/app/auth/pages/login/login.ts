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
import { ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
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
  readonly toast = inject(ToastService);
  isError = signal(false);
  isInvalidCredential = signal(false);

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
          this.toast.show({
            message: `Benvenuto ${this.form.value.username}`,
            type: ToastType.Success,
            seconds: 5,
          });
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 401) {
            this.isInvalidCredential.set(true);
            this.isError.set(false);
            return;
          }
          this.isError.set(true);
          this.isInvalidCredential.set(false);
        },
      });
  }

  togglePasswordVisibility() {
    this.passwordVisible.update((v) => !v);
  }
}
