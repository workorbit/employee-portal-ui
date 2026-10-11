import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthUser } from '../../shared/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ user: AuthUser; accessToken: string }>(),
    'Login Failure': props<{ error: string }>(),

    'Change Password': props<{ newPassword: string }>(),
    'Change Password Success': emptyProps(),
    'Change Password Failure': props<{ error: string }>(),

    'Forgot Password': props<{ email: string }>(),
    'Forgot Password Success': props<{ email: string }>(),
    'Forgot Password Failure': props<{ error: string }>(),

    'Reset Password': props<{ email: string; otp: string; newPassword: string }>(),
    'Reset Password Success': emptyProps(),
    'Reset Password Failure': props<{ error: string }>(),

    // Fired once on app bootstrap to silently restore a session from the
    // refresh_token cookie (e.g. after a page reload).
    'Restore Session': emptyProps(),
    'Restore Session Success': props<{ user: AuthUser; accessToken: string }>(),
    'Restore Session Failure': emptyProps(),

    Logout: emptyProps(),
    'Logout Success': emptyProps(),
  },
});
