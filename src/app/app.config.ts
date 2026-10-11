import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { timesheetsReducer } from './store/timesheets/timesheets.reducer';
import { TimesheetsEffects } from './store/timesheets/timesheets.effects';
import { payrollReducer } from './store/payroll/payroll.reducer';
import { PayrollEffects } from './store/payroll/payroll.effects';
import { feedbackReducer } from './store/feedback/feedback.reducer';
import { FeedbackEffects } from './store/feedback/feedback.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideStore({
      auth: authReducer,
      timesheets: timesheetsReducer,
      payroll: payrollReducer,
      feedback: feedbackReducer,
    }),
    provideEffects([AuthEffects, TimesheetsEffects, PayrollEffects, FeedbackEffects]),
  ],
};
