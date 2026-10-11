import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(selectAuthState, (state) => state.user);
export const selectAccessToken = createSelector(selectAuthState, (state) => state.accessToken);
export const selectPendingResetEmail = createSelector(
  selectAuthState,
  (state) => state.pendingResetEmail,
);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthInitialized = createSelector(selectAuthState, (state) => state.initialized);
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => !!state.accessToken,
);
