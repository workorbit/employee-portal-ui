import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
} from '../../../store/auth/auth.selectors';
import { ToastService } from '../../../shared/services/toast.service';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly showPassword = signal(false);
  protected readonly loading = this.store.selectSignal(selectAuthLoading);
  protected readonly error = this.store.selectSignal(selectAuthError);

  private readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  /** Set only while a login submitted from this component is in flight —
   * so the effect below never reacts to an unrelated auth-state change
   * (e.g. this component happening to mount while already authenticated). */
  private readonly submitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    effect(() => {
      if (!this.submitted()) return;
      if (this.isAuthenticated()) {
        this.submitted.set(false);
        this.toast.show('Signed in successfully.', 'success');
        this.router.navigateByUrl('/dashboard');
      } else if (this.error()) {
        this.submitted.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    // Sign-in navigates this tab. Opening the dashboard in a second tab up
    // front — before the login request had even been sent — meant that tab
    // booted with no refresh cookie yet and had to guess its way into a
    // session, which is what kept landing correctly-authenticated users back
    // on /login.
    this.submitted.set(true);
    this.store.dispatch(AuthActions.login({ email, password }));
  }
}
