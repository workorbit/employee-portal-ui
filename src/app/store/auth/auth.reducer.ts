import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthUser } from '../../shared/models/user.model';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /** Set once a forgot-password OTP has been emailed; cleared once the
   * reset succeeds. Drives the /reset-password route. */
  pendingResetEmail: string | null;
  loading: boolean;
  /** false while a silent session restore is still in flight on app boot */
  initialized: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  pendingResetEmail: null,
  loading: false,
  initialized: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state): AuthState => ({ ...state, loading: true, error: null })),
  on(
    AuthActions.loginSuccess,
    (state, { user, accessToken }): AuthState => ({
      ...state,
      user,
      accessToken,
      loading: false,
      initialized: true,
      error: null,
    }),
  ),
  on(
    AuthActions.loginFailure,
    (state, { error }): AuthState => ({ ...state, loading: false, error }),
  ),

  on(
    AuthActions.changePasswordSuccess,
    (state): AuthState => ({
      ...state,
      user: state.user ? { ...state.user, mustChangePassword: false } : state.user,
    }),
  ),

  on(AuthActions.forgotPassword, (state): AuthState => ({ ...state, loading: true, error: null })),
  on(
    AuthActions.forgotPasswordSuccess,
    (state, { email }): AuthState => ({ ...state, loading: false, pendingResetEmail: email }),
  ),
  on(
    AuthActions.forgotPasswordFailure,
    (state, { error }): AuthState => ({ ...state, loading: false, error }),
  ),

  on(AuthActions.resetPassword, (state): AuthState => ({ ...state, loading: true, error: null })),
  on(
    AuthActions.resetPasswordSuccess,
    (state): AuthState => ({ ...state, loading: false, pendingResetEmail: null, error: null }),
  ),
  on(
    AuthActions.resetPasswordFailure,
    (state, { error }): AuthState => ({ ...state, loading: false, error }),
  ),

  on(AuthActions.restoreSession, (state): AuthState => ({ ...state, loading: true })),
  on(
    AuthActions.restoreSessionSuccess,
    (state, { user, accessToken }): AuthState => ({
      ...state,
      user,
      accessToken,
      loading: false,
      initialized: true,
      error: null,
    }),
  ),
  on(
    AuthActions.restoreSessionFailure,
    (): AuthState => ({ ...initialAuthState, initialized: true }),
  ),

  on(AuthActions.logoutSuccess, (): AuthState => ({ ...initialAuthState, initialized: true })),
);
