import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  exhaustMap,
  fromEvent,
  map,
  of,
  retry,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthApiService } from '../../core/api/auth-api.service';
import { AuthActions } from './auth.actions';
import { UserRole } from '../../shared/models/user.model';

// Routes that don't require a session — a restoreSessionFailure while
// sitting on one of these is expected/harmless (e.g. a fresh, never-logged-
// -in visit to Home) and must NOT force a redirect. Anything else is a
// protected route, so losing the session while on one always bounces to
// /login — including when another tab's logout broadcasts in via
// authSyncIn$ below, which is what actually closes the "still usable after
// logging out elsewhere" gap.
const PUBLIC_PATHS = new Set(['/', '/login', '/forgot-password', '/reset-password']);

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  // Each browser tab runs its own copy of this app with its own in-memory
  // store — logging in/out in one tab (e.g. the dashboard tab opened from
  // Login.submit()) doesn't touch another open tab's state at all. This
  // channel tells every other same-origin tab "something changed, go
  // recheck" so they all stay consistent with the actual cookie-backed
  // session instead of showing stale login/logout UI.
  private readonly authSyncChannel = new BroadcastChannel('workhub-auth-sync');

  authSyncOut$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.logoutSuccess),
        tap(() => this.authSyncChannel.postMessage('auth-changed')),
      ),
    { dispatch: false },
  );

  authSyncIn$ = createEffect(() =>
    fromEvent(this.authSyncChannel, 'message').pipe(map(() => AuthActions.restoreSession())),
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authApi.login({ email, password }).pipe(
          // Auth rejects an employer account for this portal itself (403,
          // via the X-Portal header) before issuing any token or cookie, so
          // there's nothing left here to check or to undo.
          map((response) =>
            AuthActions.loginSuccess({ user: response.user, accessToken: response.accessToken }),
          ),
          catchError((err: HttpErrorResponse) =>
            of(
              AuthActions.loginFailure({
                error: this.friendlyErrorMessage(err, 'Unable to sign in. Please try again.'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // No auto-redirect on loginSuccess: Login.submit() opens the dashboard in
  // a new tab immediately (a direct user gesture, so it's never popup-
  // blocked) and this tab navigates to "/" once the login effect confirms
  // success — see Login.ts.

  changePassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.changePassword),
      switchMap(({ newPassword }) =>
        this.authApi.changePassword(newPassword).pipe(
          map(() => AuthActions.changePasswordSuccess()),
          catchError((err: HttpErrorResponse) =>
            of(
              AuthActions.changePasswordFailure({
                error: err.error?.message ?? 'Failed to update password.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  forgotPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      switchMap(({ email }) =>
        this.authApi.forgotPassword(email).pipe(
          map(() => AuthActions.forgotPasswordSuccess({ email })),
          catchError((err: HttpErrorResponse) =>
            of(
              AuthActions.forgotPasswordFailure({
                error: this.friendlyErrorMessage(
                  err,
                  'Unable to send a verification code. Please try again.',
                ),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  forgotPasswordRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.forgotPasswordSuccess),
        tap(() => this.router.navigateByUrl('/reset-password')),
      ),
    { dispatch: false },
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      switchMap(({ email, otp, newPassword }) =>
        this.authApi.resetPassword({ email, otp, newPassword }).pipe(
          map(() => AuthActions.resetPasswordSuccess()),
          catchError((err: HttpErrorResponse) =>
            of(
              AuthActions.resetPasswordFailure({
                error: this.friendlyErrorMessage(err, 'Invalid or expired code. Please try again.'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  resetPasswordRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.resetPasswordSuccess),
        tap(() => this.router.navigateByUrl('/login')),
      ),
    { dispatch: false },
  );

  restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      // exhaustMap, not switchMap: a second restore (the cross-tab broadcast
      // below fires one on every login) must not cancel one already in
      // flight. Cancelling only aborts the request client-side — the server
      // still processes it and rotates the refresh token, so the replacement
      // request would go out holding a token that was just superseded and
      // 401 for no reason.
      exhaustMap(() =>
        this.authApi.refresh().pipe(
          // Retry transport failures only (status 0 — backend still booting,
          // dev-server rebuild in flight). A 401 is authoritative: there is
          // no session. Retrying it used to be necessary because login
          // opened the dashboard in a second tab *before* the cookie
          // existed; that tab is gone now, and hammering /auth/refresh with
          // a stale cookie only delays an honest redirect to /login.
          retry({
            count: 2,
            delay: (error: HttpErrorResponse) => {
              if (error.status !== 0) throw error;
              return timer(500);
            },
          }),
          // A restore that was already in flight when the user signed in
          // must never overwrite the session that login just established.
          takeUntil(this.actions$.pipe(ofType(AuthActions.loginSuccess))),
          switchMap(({ accessToken }) =>
            this.authApi.me(accessToken).pipe(
              map((payload) => {
                if (payload.role !== UserRole.EMPLOYEE) {
                  throw new Error('Not an employee account');
                }
                return AuthActions.restoreSessionSuccess({
                  user: {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    companyId: payload.companyId,
                    employeeId: payload.employeeId,
                    name: payload.email.split('@')[0],
                    mustChangePassword: false,
                    payCycleStartDay: payload.payCycleStartDay,
                  },
                  accessToken,
                });
              }),
            ),
          ),
          catchError((error) => {
            if (!environment.production) {
              // eslint-disable-next-line no-console
              console.warn('[auth] Session restore failed — signing out.', error);
            }
            return of(AuthActions.restoreSessionFailure());
          }),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authApi.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())),
        ),
      ),
    ),
  );

  logoutRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigateByUrl('/login')),
      ),
    { dispatch: false },
  );

  // Closes the "logged out in one tab, still usable in another" gap: a
  // restoreSessionFailure here almost always means another tab just logged
  // out and broadcast it in via authSyncIn$ above (the cookie is now gone,
  // so this tab's own refresh call fails too) — if this tab is sitting on a
  // protected route when that happens, send it to /login immediately
  // instead of leaving stale, no-longer-authorized content on screen.
  restoreSessionFailureRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.restoreSessionFailure),
        tap(() => {
          const currentPath = this.router.url.split('?')[0];
          if (!PUBLIC_PATHS.has(currentPath)) {
            this.router.navigateByUrl('/login');
          }
        }),
      ),
    { dispatch: false },
  );

  /** The backend rate-limits login/OTP endpoints (429) with NestJS's default
   * "ThrottlerException: Too Many Requests" message — swap in something a
   * user would actually understand. */
  private friendlyErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 429) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    return err.error?.message ?? fallback;
  }
}
