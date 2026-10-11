import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'WorkHub',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    title: 'Sign in · WorkHub',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forgot-password',
    title: 'Forgot password · WorkHub',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    title: 'Reset password · WorkHub',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'dashboard',
    title: 'Dashboard · WorkHub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'timesheets',
    title: 'Timesheets · WorkHub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/timesheets/timesheets').then((m) => m.Timesheets),
  },
  {
    path: 'payroll',
    title: 'Payroll · WorkHub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/payroll/payroll').then((m) => m.Payroll),
  },
  {
    path: 'feedback',
    title: 'Feedback · WorkHub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feedback/feedback').then((m) => m.Feedback),
  },
  {
    path: 'profile',
    title: 'Profile · WorkHub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'reports',
    title: 'Reports · WorkHub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
  },
  { path: '**', redirectTo: 'dashboard' },
];
