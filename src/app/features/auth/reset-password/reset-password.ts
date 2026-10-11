import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
  selectPendingResetEmail,
} from '../../../store/auth/auth.selectors';

const RESEND_COOLDOWN_SECONDS = 30;

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendingResetEmail = this.store.selectSignal(selectPendingResetEmail);
  protected readonly loading = this.store.selectSignal(selectAuthLoading);
  protected readonly error = this.store.selectSignal(selectAuthError);

  // Seconds left before Resend is tappable again — 0 means it's available.
  protected readonly resendCooldown = signal(0);
  private cooldownIntervalId?: ReturnType<typeof setInterval>;

  protected readonly form = this.fb.nonNullable.group(
    {
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    },
    { validators: passwordsMatchValidator },
  );

  ngOnInit(): void {
    // Can only reach this screen right after a reset code has been requested.
    if (!this.pendingResetEmail()) {
      this.router.navigateByUrl('/forgot-password');
      return;
    }

    // A code is already on its way the moment this screen loads (the forgot
    // step triggers it) — start the same cooldown Resend would use.
    this.startResendCooldown();

    // Strip anything that isn't a digit as it's typed or pasted in.
    this.form.controls.otp.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      if (digitsOnly !== value) {
        this.form.controls.otp.setValue(digitsOnly, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownIntervalId) {
      clearInterval(this.cooldownIntervalId);
    }
  }

  submit(): void {
    const email = this.pendingResetEmail();
    if (!email || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { otp, newPassword } = this.form.getRawValue();
    this.store.dispatch(AuthActions.resetPassword({ email, otp, newPassword }));
  }

  resend(): void {
    const email = this.pendingResetEmail();
    if (!email || this.resendCooldown() > 0) {
      return;
    }
    this.store.dispatch(AuthActions.forgotPassword({ email }));
    this.startResendCooldown();
  }

  private startResendCooldown(): void {
    if (this.cooldownIntervalId) {
      clearInterval(this.cooldownIntervalId);
    }
    this.resendCooldown.set(RESEND_COOLDOWN_SECONDS);
    this.cooldownIntervalId = setInterval(() => {
      this.resendCooldown.update((seconds) => {
        if (seconds <= 1) {
          clearInterval(this.cooldownIntervalId);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  }
}
