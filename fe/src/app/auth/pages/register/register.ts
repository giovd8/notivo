import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserCreateDTO } from '../../../shared/models/user';
import { AuthService } from '../../services/auth';
import { Header } from '../../shared/components/header/header';

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const password = group.get('password')?.value ?? '';
    const confirm = group.get('confirmPassword')?.value ?? '';
    if (password.length === 0 || confirm.length === 0) {
      return null;
    }
    return password === confirm ? null : { passwordsMismatch: true };
  };
}

@Component({
  selector: 'notivo-register',
  imports: [ReactiveFormsModule, RouterLink, Header],
  templateUrl: './register.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);
  isError = signal(false);
  readonly form = new FormGroup(
    {
      username: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)],
      }),
    },
    { validators: passwordsMatchValidator() }
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.isError.set(false);
    });
  }

  submit() {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isError.set(false);
    this.submitting.set(true);
    this.auth
      .register(this.form.value as UserCreateDTO)
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

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible.update((v) => !v);
  }
}
